$('#submit').click(function()
{
    chrome.runtime.sendMessage(
        {
            method: "submitPinCode",
            item: $('#pincode').val()
        }
    );
});