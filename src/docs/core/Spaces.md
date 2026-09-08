# Пространства
Игровой мир в Solas организован через **пространства** (`Space`). Каждое пространство — это самостоятельная логическая область, которая содержит набор `Entity` и может быть загружена или выгружена независимо от остальных. Пространства позволяют разбивать игру на уровни, сцены или тематические зоны, загружая ровно столько, сколько нужно в данный момент.
## Структура Space
`Space` идентифицируется уникальным `Guid Id`, имеет имя (`Name`) и путь к файлу на диске (`Path`). Внутри пространства живут `Entity` и `SpaceFolder`.

```csharp
public class Space : IBranchable
{
    public Guid         Id          { get; init; }
    public string       Name        { get; set; }
    public string       Path        { get; set; }

    // Hierarchy (IBranchable)
    public Guid         RootId      { get; set; }
    public List<Guid>   BranchesIds { get; set; }

    public IBranchable          GetRoot()     { ... }
    public IEnumerable<IBranchable> GetBranches() { ... }
}
```

---

## GlobalSpace
`WorldContext.GlobalSpace` — это **глобальное пространство**, которое всегда существует, пока работает движок. В нём живут объекты, нужные на протяжении всей игры: камера, менеджеры, UI-корень и т.д.

 > `GlobalSpace` создаётся автоматически при вызове `Engine.CreateWorld()`. Вам не нужно создавать его вручную — просто обращайтесь к `WorldContext.GlobalSpace` в любом месте кода.

```csharp
// Create an Entity in GlobalSpace (the default)
var entity = new Entity(); // automatically placed in GlobalSpace
```

---
## SpaceFolder
`SpaceFolder` — это **папка внутри пространства**, предназначенная для организации `Entity` по группам (например, «Враги», «Триггеры», «Декор»). Папки поддерживают иерархию через интерфейс `IBranchable`.

```csharp
public class SpaceFolder : IBranchable
{
    public Guid       Id          { get; init; }
    public Space      Space       { get; set; }     // Changing Space re-registers the folder
    public List<Guid> EntityIds   { get; init; }    // Ids of entities in the folder

    // Hierarchy
    public Guid       RootId      { get; set; }
    public List<Guid> BranchesIds { get; set; }

    public IBranchable              GetRoot()     { ... } // parent folder
    public IEnumerable<IBranchable> GetBranches() { ... } // child folders
}
```

Получить папки пространства можно через `Query`:

```csharp
// All folders in the Space
var folders = Query.GetAllSpaceFoldersIn(space);

// Specific folder by Id
var folder = Query.GetSpaceFolderWith(folderId, space);
```

---
## IBranchable — навигация по иерархии
Как `Space`, так и `SpaceFolder` реализуют `IBranchable`. Это позволяет выстраивать дерево пространств и папок и свободно по нему перемещаться:

```csharp
// Get the root of the Space hierarchy
IBranchable root = levelSpace.GetRoot();

// Get child Spaces
IEnumerable<IBranchable> children = levelSpace.GetBranches();

// Walk the tree
void PrintTree(IBranchable node, int depth = 0)
{
    Console.WriteLine(new string(' ', depth * 2) + node);
    foreach (var branch in node.GetBranches())
        PrintTree(branch, depth + 1);
}
```

---

## Загрузка и выгрузка пространств
Все операции с пространствами выполняются через статические методы `Command`:

| Метод | Описание |
| --- | --- |
| `Command.LoadSpace(path)` | Загружает пространство из файла по пути |
| `Command.LoadLocalSpace(path, rootSpace)` | Загружает пространство как дочернее к `rootSpace` |
| `Command.UnloadSpace(space)` | Выгружает пространство и освобождает его Entity |
| `Command.SaveSpace(space)` | Сохраняет текущее состояние пространства на диск |

```csharp
// Load a level
var level = Command.LoadSpace("assets://Levels/Level01.space");

// Load as a child Space
var subArea = Command.LoadLocalSpace(
    "assets://Levels/Cave.space",
    rootSpace: level
);

// Save level progress
Command.SaveSpace(level);

// Unload the level (destroys all entities inside)
Command.UnloadSpace(level);
```

---
## Пример: смена уровня

Типичный паттерн загрузки нового уровня при выгрузке текущего:
```csharp
public class LevelManager : Logic
{
    private Space _currentLevel;

    public void LoadLevel(string levelPath)
    {
        // Unload the previous level, if any
        if (_currentLevel != null)
        {
            Command.SaveSpace(_currentLevel);
            Command.UnloadSpace(_currentLevel);
        }

        // Load the new level as a child of GlobalSpace
        _currentLevel = Command.LoadLocalSpace(
            levelPath,
            rootSpace: WorldContext.GlobalSpace
        );

        Console.WriteLine($"Уровень загружен: {_currentLevel.Name}");
    }

    public void UnloadCurrentLevel()
    {
        if (_currentLevel == null) return;
        Command.UnloadSpace(_currentLevel);
        _currentLevel = null;
    }
}
```

---
## Получение Entity из пространства
Для поиска и фильтрации объектов внутри пространства используйте `Query`:

```csharp
// All entities in the Space
var entities = Query.GetEntitiesIn(level);

// Only enabled entities
var active = Query.GetEntitiesInAvailable(level);

// Entities that have a specific component
var enemies = Query.GetEntitiesByType<EnemyData>(level);

// Entities that have several components at once
var armed = Query.GetEntitiesWith(level, typeof(WeaponData), typeof(EnemyData));

// Get a component of a specific type from the Space
var playerData = Query.GetComponentByType<PlayerData>(level);
```