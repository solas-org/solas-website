# Цикл update
Каждый кадр Solas последовательно вызывает три фазы обновления: **Update**, **FixedUpdate** и **LateUpdate**. Это разделение позволяет чётко распределить ответственность: игровая логика живёт в `Update`, физика и детерминированные расчёты — в `FixedUpdate`, финальные операции рендера и интерполяции — в `LateUpdate`. Подключить класс к циклу можно двумя способами: через атрибуты на `Logic`-классах или реализовав интерфейс `IUpdateSystem`.

---

## Атрибуты для Logic-классов
Самый простой способ войти в цикл обновления — пометить `Logic`-класс одним из трёх атрибутов. Source Generators движка автоматически сгенерируют для него runner и зарегистрируют его в `EntityPool`:

```csharp
[AttributeUsage(AttributeTargets.Class)]
public class UpdateAttribute      : Attribute { public bool Parallel { get; set; } }

[AttributeUsage(AttributeTargets.Class)]
public class FixedUpdateAttribute : Attribute { public bool Parallel { get; set; } }

[AttributeUsage(AttributeTargets.Class)]
public class LateUpdateAttribute  : Attribute { public bool Parallel { get; set; } }
```
### Пример: Logic с \[Update\]

```csharp
[Update]
public partial class MovementLogic : Logic
{
    public void Update()
    {
        var transform = Entity.GetData<TransformData>();
        var movement  = Entity.GetData<MovementData>();

        // Move the object using the frame delta time
        var velocity = movement.Velocity.Value;
        var delta    = (float)Time.DeltaTime;

        transform.Position.Value = new Vector3(
            transform.Position.Value.X + velocity.X * delta,
            transform.Position.Value.Y + velocity.Y * delta,
            transform.Position.Value.Z + velocity.Z * delta
        );
    }
}
```

 > Используйте `[FixedUpdate]` для всей физики и коллизий. Фиксированный шаг гарантирует детерминированное поведение независимо от производительности устройства. При пиковой нагрузке движок выполняет не более `MaxFixedStepsPerTick = 5` шагов за кадр, чтобы не допустить «спирали смерти».
### Параллельное выполнение
Добавьте `Parallel = true` для параллельного запуска runners на нескольких потоках:

```csharp
// All ParticleLogic instances will update in parallel
[Update(Parallel = true)]
public partial class ParticleLogic : Logic
{
    public void Update()
    {
        // Independent computations, safe to run in parallel
        var particle = Entity.GetData<ParticleData>();
        particle.Lifetime.Value -= (float)Time.DeltaTime;
    }
}
```

> Используйте `Parallel = true` только для Logic, которые **не разделяют изменяемое состояние** между несколькими сущностями. Если логика читает данные чужих Entity или пишет в общие коллекции — параллельный режим может вызвать гонку данных.

---
## IUpdateSystem — системные апдейтеры
Для логики, не привязанной к конкретному `Entity` (рендер, аудио, сеть), реализуйте интерфейс `IUpdateSystem`:
```csharp
public interface IUpdateSystem
{
    UpdateType UpdateType { get; }
    void Update(Space space);
}
```

Системы регистрируются через `CoreSettings.UpdateSystems` и создаются при `Engine.CreateUpdateSystems()`:
### Типы обновления
```csharp
public enum UpdateType
{
    Update,       // Every frame, variable dt
    FixedUpdate,  // Fixed step, deterministic
    LateUpdate    // After Update, for post-processing
}
```
### Пример: IUpdateSystem для обработки компонентов в пространстве с какими-то данными

```csharp
public class ProcessSystem : IUpdateSystem
{
    // Runs each frame after Update
    public UpdateType UpdateType => UpdateType.LateUpdate;

    public void Update(Space space)
    {
        foreach (var entity in Query.GetEntitiesByType<SomeData>(space))
        {
            if (!entity.IsEnabled.Value) continue;

            // ... do processing
        }
    }
}
```

Регистрация в `CoreSettings.set`:

```json
{
  "UpdateSystems": [
    "MyGame.RenderSystem, MyGame"
  ]
}
```

---

## GameState — управление состоянием движка
`Engine.State` управляет жизненным циклом игрового цикла:

```csharp
public enum GameState
{
    None,    // Engine is stopped
    Start,   // Initialization and start
    Update,  // Active update loop
    Pause    // Paused (TimeScale = 0, loop keeps running)
}
```

```csharp
// Start the game
Engine.State = GameState.Start;  // => resolves dependencies, transitions to Update

// Pause
Engine.State = GameState.Pause;  // => TimeScale = 0, Update keeps running

// Resume
Engine.State = GameState.Update; // => TimeScale = 1

// Shut down
Engine.State = GameState.None;   // => saves assets, unloads Spaces
```

>  В состоянии `Pause` цикл **не останавливается** — `Update`, `FixedUpdate` и `LateUpdate` продолжают вызываться. Пауза реализована через `Time.TimeScale = 0`, поэтому системы, использующие `Time.DeltaTime`, автоматически «замирают». Если вам нужен UI или анимация меню паузы, которые продолжают работать — просто не умножайте их движение на `DeltaTime`.

---
## Статический класс Time
`Time` предоставляет данные о времени текущего кадра:

```csharp
public static class Time
{
    // Time of the last frame, scaled by TimeScale (seconds)
    public static double DeltaTime      { get; internal set; }

    // Fixed step for FixedUpdate (seconds, default 0.02 = 50 Hz)
    public static double FixedDeltaTime { get; set; } = 0.02;

    // Time scale: 1.0 = normal, 0.5 = slow-mo, 0.0 = pause
    public static double TimeScale      { get; set; } = 1.0;

    // Fraction of accumulated time between two FixedUpdate steps [0..1]
    // Used for interpolating positions in LateUpdate
    public static double Alpha          { get; internal set; }
}
```

>  `Time.Alpha` особенно важен при рендере: он показывает, насколько текущий кадр находится «между» двумя физическими шагами. Используйте `Alpha` в `LateUpdate` для интерполяции визуальных позиций и избегания дёргания объектов.

---
## TargetFrameTime и управление FPS

Целевой FPS задаётся полем `TargetFrameTime` в `CoreSettings`:

```json
{
  "TargetFrameTime": 60.0
}
```

Движок после каждого тика высчитывает оставшееся время до следующего кадра и засыпает на него через `Thread.Sleep` \+ `Thread.SpinWait`. Это значит, что движок **не сжигает CPU** при высоком FPS.

```csharp
// Change the target FPS at runtime:
var core = Query.GetSettings<CoreSettings>();
core.TargetFrameTime = 30.0f; // Switch to 30 FPS
Command.WriteExistingSettings(core);
```

---
## Порядок выполнения за один кадр
1. FixedUpdate, пока `accumulator ≥ FixedDeltaTime`:
- `IUpdateSystem` (FixedUpdate)
- Logic runners `[FixedUpdate]`
2. Update
- `IUpdateSystem` (Update)
- Logic runners `[Update]`
3. Late Update
- `IUpdateSystem` (LateUpdate)
- Logic runners `[LateUpdate]`
4. Ожидание до следующего `TargetFrameTime`.
