# Command
Взаимодействие вашего кода с миром может осуществляться с помощью команд. В Solas `Command` – статический класс, позволяющий отдавать команды ядру движка. В коде функции разделены по регионам, в документации же отделены заголовками.
## Settings System  
```
WriteExistingSettings(IData settings)  
WriteNewSettings(IData settings, string path)  
```
## DI System  
```
public static T AutoInject<T>(Space space) where T : Logic  
public static T Inject<T>(Guid id, Guid spaceId) where T : class, IReferenceable 
```
## Assets Pool  
```
public static void RegisterNewAsset(Asset asset)  
public static void WriteAsset(Asset asset, FileStream stream, BinaryWriter binaryWriter)  
public static void WritePrefab(Entity entity, FileStream stream, BinaryWriter binaryWriter)  
public static void SaveAsset(Asset asset)  
public static void SaveNewAssets()  
public static void SaveAsPrefab(Entity entity)  
```
## Space Pool  
```
public static Space LoadSpace(string path, bool immediateBuild = true)  
public static Space LoadLocalSpace(string path, Space rootSpace = null)  
public static void UnloadSpace(Space space)  
public static void SaveSpace(Space space)  
```
## Entity Pool  
```
public static void RegisterRunner(IUpdateRunner runner)  
public static void RegisterFixedRunner(IUpdateRunner runner)  
public static void RegisterLateRunner(IUpdateRunner runner)  
```
## Registries  
```
public static void RegisterDataRead<T>(string typeName) where T : IData  
public static void RegisterLogicAdd<T>(string typeName) where T : Logic, new()  
```