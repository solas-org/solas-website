# Сборка
Solas поставляется со встроенным модулем сборки — проектом `Build`, который автоматизирует подготовку ассетов и публикацию игры через `dotnet publish`. Все параметры сборки описываются в классе `BuildSettings`, который читается из JSON-файла настроек так же, как и `CoreSettings`. Правильно настроив `BuildSettings`, вы получаете единую точку управления целевой платформой, форматом дистрибутива и размером финального бинарника.

## Класс `BuildSettings`

`BuildSettings` помечен атрибутом `[SettingsSection]`, поэтому движок автоматически считывает его из папки настроек при запуске Build-проекта. Ниже приведены все поля с описанием.

```csharp
// Core/Settings/BuildSettings.cs
[SettingsSection]
public class BuildSettings : IData
{
    public string Serializer        = "Solas.Serialization.Binary.BinarySerializer, Core";
    public string GameName          = "My Game";
    public string IconPath          = "";
    public string Company           = "Default Company";
    public string Version           = "1.0.0";
    public string OutputDirectory   = Path.Combine(Directory.GetCurrentDirectory(), "publish");
    public string RuntimeIdentifier = "win-x64";
    public bool   SelfContained     = true;
    public bool   SingleFile        = true;
    public bool   ReadyToRun        = false;
    public bool   Trimmed           = false;
    public bool   DeleteExisting    = true;
}
```


---

## Пример `BuildSettings.json`

Файл должен находиться в папке `engine://Settings` (по умолчанию — `./Solas/Settings/BuildSettings.json`):

```csharp
{
  "Serializer": "Solas.Serialization.Binary.BinarySerializer, Core",
  "GameName": "Stellar Drift",
  "IconPath": "Assets/Icons/game.ico",
  "Company": "My Studio",
  "Version": "0.9.0",
  "OutputDirectory": "C:/Builds/StellarDrift",
  "RuntimeIdentifier": "win-x64",
  "SelfContained": true,
  "SingleFile": true,
  "ReadyToRun": true,
  "Trimmed": false,
  "DeleteExisting": true
}
```

---

## Запуск сборки через Build-модуль

Build-модуль — отдельный проект-инструмент `Solas.Build`, точкой входа которого служит `Build/Program.cs`. Он инициализирует две виртуальные файловые системы (редакторскую и рантаймовую), читает настройки и запускает `BuildPipeline`.

`BuildPipeline` выполняет два этапа:

1. **ProcessAssets** — конвертирует ассеты из редакторского формата в рантаймовый сериализатор и копирует их в `OutputDirectory`.
2. **PublishProject** — запускает `dotnet publish` с параметрами из `BuildSettings`.

Запустить сборку можно командой:

```bash
dotnet tool exec Solas.Build -- "PATH/TO/YOUR/CSPROJ/FILE" "YourSerializerFullName, AssemblyName"
```

---

## Рекомендации по конфигурации для разных платформ

| Платформа | `RuntimeIdentifier` | `SelfContained` | `SingleFile` | `ReadyToRun` | `Trimmed` |
| --- | --- | --- | --- | --- | --- |
| Windows x64 (Steam) | `win-x64` | `true` | `true` | `true` | `false` |
| Windows x64 (itch.io) | `win-x64` | `true` | `true` | `false` | `false` |
| Linux x64 | `linux-x64` | `true` | `true` | `true` | `false` |
| macOS Apple Silicon | `osx-arm64` | `true` | `false` | `false` | `false` |
| macOS Intel | `osx-x64` | `true` | `false` | `false` | `false` |
| Сервер Linux (ARM) | `linux-arm64` | `false` | `false` | `false` | `false` |

>   **Не используйте `Trimmed = true` без тщательного тестирования.** Движок Solas активно использует рефлексию: `Activator.CreateInstance` применяется при создании систем обновления (`CreateUpdateSystems`), сериализаторов (`SetSerializer`) и других компонентов. Тримминг может удалить типы, на которые нет прямых ссылок в коде, что приведёт к `TypeLoadException` или `MissingMethodException` во время выполнения. Если вы всё же хотите включить тримминг — настройте файл `TrimmerRootDescriptor.xml` и добавьте атрибуты `[DynamicallyAccessedMembers]` к критичным типам.
