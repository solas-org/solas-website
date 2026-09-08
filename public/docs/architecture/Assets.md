# Assets
Ассеты в Solas – не просто заранее заданные примитивы, это удобный инструмент подгрузки любых данных из диска. Сейчас мы разберем зачем они нужны и почему они удобны.
## Базовый класс Asset
Ассеты в Solas – ссылочные данные, они автоматически регистрируются во внутреннем пуле ассетов и их можно подгружать через Query.
```csharp
public abstract class Asset : IReferenceable
{
    protected Asset()
    {
        EngineContext.AssetsPool.RegisterNewAsset(this);
    }

    public Guid Id { get; init; } = Guid.NewGuid();

    public Guid GetSpaceId()
    {
        return Guid.Empty;
    }

    public static IReferenceable SearchReferenceable<T>(Guid id, Guid spaceId) where T : class, IReferenceable
    {
        return EngineContext.AssetsPool.LoadAsset<T>(id);
    }
}
```
В ядре уже есть текстовый ассет
```csharp
public sealed class TextAsset : Asset
{
    public string[] Lines = [];
}
```
## Сериализация
Для ассетов необходимо писать кастомные сериализаторы, которых подробно говорится в [этой главе](Serialization). При сериализации и десереализации **необходимо** учитывать Id ассета, это крайне важно для избегания проблем с зависимостями. Мы не будем останавливаться на сериализации, но покажем пример текстового сериалайзера.
```csharp
public class TextAssetSerializer : ICustomSerializer<TextAsset>
{
    public void Write(TextAsset value, FileStream stream, Serializer serializer, string name = null)
    {
        serializer.Write(value.Id, stream, "Id");
        serializer.WriteArray(value.Lines, stream, EngineContext.Serializer.Write,"Lines");
    }

    public TextAsset Read(FileStream stream)
    {
        var asset = new TextAsset
        {
            Id = EngineContext.Serializer.ReadGuid(stream),
            Lines = EngineContext.Serializer.ReadArray<string>(stream,  EngineContext.Serializer.ReadString)
        };

        return asset;
    }
}
```
# Prefabs
Всё очень просто. Prefab = Entity в постоянной памяти. Вы можете в любой момент загружать через `Query.LoadPrefab` и выгружать префабы через `Commad.SaveAsPrefab`. Для них не требуется специальная сериализация, все уже настроено.