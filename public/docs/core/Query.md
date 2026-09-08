# Query
Получение каких-либо данных из мира реализовано с помощью статического класса `Query`. В коде функции разделены по регионам, в документации же отделены заголовками.
## Serializer
Возвращает текущий сериализатор движка.
## Settings System
```
public static T GetSettings<T>() where T : class, IData
```
## Assets Pool  
```
public static T GetAsset<T>(Guid id) where T : Asset, new()  
public static Asset GetLoadedAsset(Guid id)  
public static Asset GetUnknownAsset(FileStream stream)
public static Entity LoadPrefab(Guid guid)
```
## Space Pool  
```
public static SpaceFolder GetSpaceFolderWith(Guid guid, Space space)  
public static SpaceFolder GetSpaceFolderWith(Guid guid, Guid spaceId)  
public static IEnumerable<SpaceFolder> GetSpaceFoldersWith(List<Guid> guids, Space space) public static List<SpaceFolder> GetAllSpaceFoldersIn(Space space)  
public static Space GetSpace(Guid guid)  
public static string[] GetLocalSpacesPaths()
```
## Entity Pool  
```
public static IEnumerable<Entity> GetEntitiesIn(Space space)  
public static IEnumerable<Entity> GetEntitiesIn(SpaceFolder spaceFolder)  
public static IEnumerable<Entity> GetEntitiesInAvailable(Space space)  
public static IEnumerable<Entity> GetEntitiesByType<T>(Space space)  
public static IEnumerable<Entity> GetEntitiesByTypeInAvailable<T>(Space space)  
public static IEnumerable<Entity> GetEntitiesWith(Space space, params Type[] types)  
public static IEnumerable<Entity> GetEntitiesInAvailableWith(Space space, params Type[] types)  
public static IEnumerable<T> GetComponentsByType<T>(Space space)  
public static IEnumerable<T> GetComponentsByTypeInAvailable<T>(Space space)  
public static T GetComponentByType<T>(Space space)  
public static T GetComponentByTypeInAvailable<T>(Space space)  
public static Entity TryGetEntityFor(object component, Space hintSpace = null)  
```
## Vfs 
```
public static string GetPath(string path)
```
## DISystem  
```
public static ReadOnlySpan<(Guid, Guid)> LastInjectables
```
