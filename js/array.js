// class Arr
// {
//     constructor(length)
//     {
//         this.array = new Array(length);
//     }

//     fill(value)
//     {
//         var i = 0;
//         while (i < this.array.length)
//         {
//             this.array[i] = value;
//             i++;
//         }

//         return this.array;
//     }   
// }

function makeNewArray(length, fill)
{
    var array = [];

    var i = 0;
    while (i < length)
    {
        array[i] = fill;
        i++;
    }

    return array;
}   