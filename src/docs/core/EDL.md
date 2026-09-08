# EDL
Solas строится вокруг паттерна **EDL** — Entity-Data-Logic. Вместо монолитных игровых объектов с полями и методами в одном месте, каждый объект мира раскладывается на три самостоятельные роли: **Entity** хранит идентичность и связывает компоненты, **Data** несёт чистое состояние, а **Logic** описывает поведение. Такое разделение упрощает тестирование, переиспользование кода и параллельные обновления.

## Entity

`Entity` — это лёгкий контейнер-идентификатор. Он знает, к какому `Space` принадлежит, имеет уникальный `Guid Id` и хранит списки прикреплённых `IData` и `Logic`. Сам по себе `Entity` не содержит игровой логики — его задача исключительно структурная.

При создании `Entity` автоматически регистрируется в глобальном `EntityPool`:

```csharp
// Entity is automatically registered in EntityPool by the constructor
var entity = new Entity();

// Explicitly set the Space (defaults to WorldContext.GlobalSpace)
var entity = new Entity(space: levelSpace);

// Set a specific Guid
var entity = new Entity(id: Guid.NewGuid(), space: levelSpace);
```

### Управление Data и Logic

| Метод | Описание |
| --- | --- |
| `AddData<T>(data)` | Добавляет экземпляр `IData` к сущности |
| `RemoveData<T>(data)` | Удаляет экземпляр `IData` |
| `GetData<T>()` | Возвращает первый `IData` нужного типа |
| `AddLogic<T>()` | Создаёт и добавляет `Logic` нужного типа |
| `RemoveLogic<T>(logic)` | Удаляет экземпляр `Logic` |
| `GetLogic<T>()` | Возвращает первый `Logic` нужного типа |

`AddLogic<T>()` создаёт экземпляр `Logic` внутри и сразу проставляет ему ссылку `Entity`, так что вам не нужно передавать её вручную.

---

## Data

`Data` — это чистые классы или структуры состояния. Они реализуют интерфейс `IData` и **не содержат никакой логики**: только поля и реактивные свойства.

```csharp
// Engine interface definition:
// public interface IData : IInjectable, IDisposable { }

public class PlayerData : IData
{
    public DataProperty<int>   Health  = new();
    public DataProperty<float> Speed   = new();
    public string              Name    = string.Empty;
}
```

### ReactiveProperty\<T\>

`ReactiveProperty<T>` — простейшая реактивная обёртка над значением. При изменении `Value` вызывается событие `OnChange`:

```csharp
public class ReactiveProperty<T>
{
    public Action<T> OnChange = delegate { };
    public T Value { get; set; }   // setter fires OnChange only on actual change
}

// Usage:
var hp = new ReactiveProperty<int>();
hp.OnChange += newHp => Console.WriteLine($"HP изменился: {newHp}");
hp.Value = 100; // => "HP changed: 100"
```

### DataProperty\<T\>

`DataProperty<T>` наследует `ReactiveProperty<T>` и добавляет поддержку **модификаторов** — объектов `DataModifier<T>`, которые могут изменять итоговое значение (например, бонусы к урону или скорости):

```csharp
public class DataProperty<T> : ReactiveProperty<T>
{
    public TModifier AddModifier<TModifier>()    where TModifier : DataModifier<T>, new();
    public void      RemoveModifier<TModifier>() where TModifier : DataModifier<T>;
    public TModifier GetModifier<TModifier>()    where TModifier : DataModifier<T>;
}
```


 > Используйте `DataProperty<T>` для игровых характеристик (здоровье, скорость, урон), которые могут модифицироваться баффами и дебаффами. Используйте `ReactiveProperty<T>` для простых флагов и состояний, которые нужно отслеживать реактивно.

---

## Logic

`Logic` — это ООП-класс поведения, привязанный к конкретному `Entity`. Он получает доступ к данным через `Entity.GetData<T>()` и **не хранит игровое состояние самостоятельно**. Это гарантирует, что все данные живут только в `IData`-компонентах и могут быть сериализованы отдельно.

```csharp
public class PlayerLogic : Logic
{
    private PlayerData GetData() => Entity.GetData<PlayerData>();

    public void TakeDamage(int amount)
    {
        var data = GetData();
        data.Health.Value = Math.Max(0, data.Health.Value - amount);
    }

    public bool IsAlive() => GetData().Health.Value > 0;
}
```

---

## Полный пример: создание игрока

Ниже — полный цикл: определение данных, логики и сборка сущности.

```csharp
// 1. Data — state only
public class PlayerData : IData
{
    public DataProperty<int>   Health  = new() { Value = 100 };
    public DataProperty<float> Speed   = new() { Value = 5.0f };
    public string              Name    = "Hero";
}

// 2. Logic — behavior only
public class PlayerLogic : Logic
{
    private PlayerData Data => Entity.GetData<PlayerData>();

    public void TakeDamage(int amount)
    {
        Data.Health.Value = Math.Max(0, Data.Health.Value - amount);
        if (Data.Health.Value == 0)
            Console.WriteLine($"{Data.Name} погиб!");
    }

    public void Heal(int amount)
    {
        Data.Health.Value = Math.Min(100, Data.Health.Value + amount);
    }
}

// 3. Assemble the Entity
var entity     = new Entity(space: levelSpace);
var playerData = entity.AddData(new PlayerData { });
var playerLogic = entity.AddLogic<PlayerLogic>();

// 4. React to health changes
playerData.Health.OnChange += hp => Console.WriteLine($"HP: {hp}");

// 5. Use the logic
playerLogic.TakeDamage(30); // => "HP: 70"
playerLogic.TakeDamage(70); // => "HP: 0", "Hero died!"
```

---

## TransformData — встроенный пример Data

Стандартный пример `IData` в движке — `TransformData`, хранящий позицию, поворот и масштаб объекта:

```csharp
public sealed partial class TransformData : IData
{
    public DataProperty<Vector3> Position;
    public DataProperty<Vector3> Rotation;
    public DataProperty<Vector3> Scale;
}

// Attach a transform to the entity:
var transform = entity.AddData(new TransformData());
transform.Position.Value = new Vector3(0, 1, 0);
```

---

## EDL vs ECS vs COP

  EDL внешне похож на ECS (Entity-Component-System), но отличается в ключевом месте: **Logic — это ООП-класс с методами**, привязанный к конкретному Entity, а не «система», итерирующая по массивам компонентов всего мира. Это даёт более привычную объектно-ориентированную модель при сохранении чёткого разделения состояния и поведения.
  
|Критерий|EDL|**ECS**|**COP (Unity-like)**|
|---|---|---|---|
|**Базовая единица**|Entity (контейнер + метаданные)|Entity ID|GameObject|
|**Данные**|Data (struct/class, гибрид)|Components (строгие struct)|Components (class)|
|**Логика**|Logic-классы, привязанные к Entity|Systems (batch processing)|Component methods|
|**Связь логики и данных**|Средняя (через Entity reference)|Жёстко разделена|Сильная (в одном компоненте)|
|**Парадигма**|Гибрид OOP + COP + partial data-oriented|Data-oriented pure model|OOP composition|
|**Гибкость структуры данных**|Высокая (struct/class выбор)|Средняя (struct-first)|Высокая, но хаотичная|
|**Порог входа**|Низкий/средний|Средний/высокий|Низкий|
|**Производительность CPU cache**|Высокая|Очень высокая|Низкая/средняя|
|**Генерация кода (SourceGenerators)**|Ключевая часть системы|Обычно вторично|Не требуется|
|**Dependency Injection**|Встроенная концептуально|Обычно отсутствует|Часто ручная|
|**Параллелизм**|Декларативный (атрибуты/flags)|Batch-based parallel systems|Почти отсутствует|
|**Регистрация сущностей**|Отсутствует|World setup|Отсутсвует|
|**Boilerplate**|Очень низкий|Средний|Низкий|
|**Масштабирование проекта**|Высокое|Очень высокое|Среднее|
|**Runtime overhead**|Низкий (благодаря кодогенерации)|Очень низкий|Средний|
|**Memory layout контроль**|Частичный|Полный контроль|Почти отсутствует|
|**Сериализация**|Генерируемая + ручная + кастомные сериалайзеры|Ручная/системная|Ручная|