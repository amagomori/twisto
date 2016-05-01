class Preference
{
    constructor()
    {
        // do nothing.
    }

    static get(key)
    {
        return localStorage[key];
    }

    static set(key, value)
    {
        localStorage[key] = value;
    }

    static remove(key)
    {
        localstorage.RemoveItem(key);
    }
}
