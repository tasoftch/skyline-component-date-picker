# Skyline Date Picker Component
The date picker component extends your application by adding a graphical interface for date and time input fields.


### Installation
```bin
$ composer require skyline/component-date-picker
```

### Usage
````html
<div class="form-group">
    <div class="input-group">
        <input type="text" class="form-control" id="myPicker">
        <div class="input-group-prepend">
            <button class="btn btn-outline-primary" type="button" onclick="$('#myPicker').datepicker('open')">...</button>
        </div>
    </div>
</div>
<script type="application/javascript">
$(function() {
    $("#myPicker").datepicker("init", {
        autoOpen: false,
        autoUpdate: true,
        setDefaultDate: true,
        showClearBtn: true,
        mirror: "#result",
        mirrorFormat: "yyyy-mm-dd"
    })
}
</script>
````

### Links
https://materializecss.com/pickers.html