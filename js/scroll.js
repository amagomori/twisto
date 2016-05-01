class ScrollPos 
{
    constructor()
    {
        // TODO: Check whether static method works correctly using constructor.
        this.key = 'scrollPosition';
    }

    static top()
    {
        return $(window).scrollTop();
    }

    static set(position)
    {
        var _position = (position === undefined) ? '0' : position;
        $(window).scrollTop(_position);
    }

    static save(position = this.top())
    {
        localStorage['scrollPosition'] = position;
    }

    static isPageEnd()
    {
        var windowHeight    = $(window).height();
        var scrolledLength  = this.top();
        var pageHeight      = $(document).height();

        const ACCEPTABLE    = 80;

        if (pageHeight - (windowHeight + scrolledLength) <= 0 + ACCEPTABLE)
        {
            return true;
        }
        else
        {
            return false;
        }
    }
}
