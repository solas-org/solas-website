# Быстрый старт
Это руководство проведёт вас от чистого рабочего окружения до работающего игрового цикла на Solas. Вы настроите виртуальную файловую систему, инициализируете движок и создадите первую сущность с данными и логикой, опираясь на API движка.

# Подготовка окружения

Перед началом убедитесь, что в системе установлен [**.NET 10 SDK**](https://dotnet.microsoft.com/download/dotnet/10.0) или новее.
Проверьте версию в терминале:

```bash
dotnet --version
  # Ожидаемый вывод: 10.x.x+
```
Solas использует возможности .NET 10 (Primary Constructors, новые API параллелизма и др.). Более ранние версии SDK не гарантируют стабильную работу.
Создайте новое решение через консоль или своё IDE:

```bash
dotnet new sln --name MyGame
```

# Проект
## Заготовка
Вы можете воспользоваться заготовкой проекта и перейти сразу к написанию игры!
```bash
dotnet new install Solas.Templates.Console
dotnet new sls-console -o MyGame
```
## Самостоятельная настройка
### Проект
Создайте консольный проект и откройте файл с расширением csproj.
В `PropertyGroup` необходимо указать свойство 

```C#
<SerializerName>Solas.Serialization.Json.EngineJsonSerializer, Core</SerializerName>
```
Оно отвечает за класс сериализатор, который будет использовать при **работе** над проектом. Сериализатор, который отвечает за работу в билде, мы настроим позже.
В `ItemGroup` необходимо указать ссылку на основной пакет Solas. 

```C#
<PackageReference Include="Solas" Version="*" />
```

> Version="\*" означает самую последнюю версию движка на данный момент

Затем необходимо написать **вне** блоков `PropertyGroup` и `ItemGroup` небольшой вспомогательный генератор, чтобы мы могли ссылаться на `SerializerName` в скриптах.

```C#
<Target Name="GenerateSerializerConfig" BeforeTargets="BeforeCompile;CoreCompile">
        <PropertyGroup>
            <ConfigCode>
                <![CDATA[
                public record struct RuntimeConfig
                {
                    public static readonly string SerializerName = "$(SerializerName)"%3B
                }
                ]]>
            </ConfigCode>
        </PropertyGroup>

        <WriteLinesToFile File="$(IntermediateOutputPath)BuildConfig.g.cs"
                          Lines="$(ConfigCode)"
                          Overwrite="true"
                          WriteOnlyWhenDifferent="true" />

        <ItemGroup>
            <Compile Include="$(IntermediateOutputPath)BuildConfig.g.cs" />
        </ItemGroup>
    </Target>
```

### Программа
Откройте `Program.cs` и настройте движок перед запуском игрового цикла. Порядок вызовов имеет значение: сначала **сериализатор, затем VFS, затем настройки и мир**.

> *Что такое сериализатор?* 
> Сериализатор – это скрипт, который преобразует какие-либо данные в определнный формат, а в нашем случае еще и записывает в файловый поток. В Solas сериализатор используется для сохранения всего: пространств, префабов, ассетов. Причем сериализация может быть абсолютно любого формата, дальше мы это затронем подробнее.

1. В главном методе запишите 
   `Engine.SetSerializer(RuntimeConfig.SerializerName);`
Это создат сериализатор, который мы указывали ранее в .csproj файле.
2. Затем создайте виртуальную файловую систему в **текущей директории**, чтобы обращаться к не по короткому пути
   `var vfs = new VirtualFileSystem(Directory.GetCurrentDirectory());`
   Затем монтируем необходимые директории: assets и engine
   `vfs.Mount("assets", "Assets");`
   `vfs.Mount("engine", "Solas");`
   Устанавливаем VFS в качестве основной для движка.
   `Engine.SetVfs(vfs);`
3. Убеждаемся, что все необходимые директории существуют (если их не окажется, то движок создаст их)
   ```
   Engine.EnsureNeededDirectories(
	   vfs.GetMountPath("assets"),
	   vfs.GetMountPath("engine"),
	   vfs.GetPath("engine://Settings"));
   ```
4. Загружаем / создаём базовые настройки с помощью этой команды
   `Engine.LoadEngineSettings(vfs.GetPath("engine://Settings"));`
5. Создаём системы апдейта
   `Engine.CreateUpdateSystems();`
6. Создаём мир игры
   `Engine.CreateWorld();`
7. И, наконец, запускаем двигатель!
   `Engine.State = GameState.Start;`