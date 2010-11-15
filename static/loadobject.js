
loader = {
    async: true,
    
    exceptionHandler: function(o, statusText) {
        alert(statusText + "\n" + o);
    },
    
    get: function(param, url, callback, async) {
        loader.execute(param, url, "GET", callback, async);
    },
    
    post: function(param, url, callback, async) {
        loader.execute(param, url, "POST", callback, async);
    },
    
    del: function(param, url, callback, async) {
        loader.execute(param, url, "DELETE", callback, async);
    },
    
    execute: function(param, url, method, callback, async) {
        if (async == null) {
            async = loader.async;
        }
        if (method == null) {
            method = "GET";
        }
        var submitData = loader._getSubmitData(obj, url);
        var data = submitData.data;
        url = submitData.url;
        loader._call(data, url, method, callback, async);
    },
    
    _getSubmitData: function(obj, url) {
        if (obj == null) {
            obj = new Object();
        }
        if (obj.tagName == "FORM") {
            if (url == null) {
                url = obj.action;
            }
            data = loader._getObjectFromForm(obj);
        }
        return {"data": JSON.stringify(obj), "url": url};
    },
    
    _call: function(data, url, method, callback, async) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                var header = request.getResponseHeader("Content-Type");
                var response = null;
                if (header.indexOf("text/json") > -1) {
                    response = JSON.parse(request.responseText);
                } else {
                    response = request.responseText;
                }
                if (request.status == 200) {
                    callback = loader._getFunction(callback);
                } else {
                    callback = loader._getFunction(loader.exceptionHandler, request.statusText);
                }
                callback(response);
            }
        }
        request.open(method, url, async);
        request.setRequestHeader("Content-type", "text/json");
        request.send(data);
    },
    
    _getFunction: function(f) {
        if (typeof(f) == "string") {
            try {
                f = eval(f);
            } catch (err) {
                f = function() {};
            }
        }
        if (f == null) {
            f = function() {}
        }
        return f;
    },
    
    _getObjectFromForm: function(form) {
        var result = new Object();
        loader._readFormInput(result, form);
        loader._readFormSelect(result, form);
        loader._readFormTextArea(result, form);
        return result;
    },
    
    _readFormInput: function(result, form) {
        var input = form.getElementsByTagName("INPUT");
        for (var i = 0; i < input.length; i++) {
            if (input[i].name != null && input[i].name.length > 0 && input[i].type.toLowerCase() != "file") {
                if (input[i].type.toLowerCase() == "radio") {
                    if (input[i].checked) {
                        loader._setObjectProperty(result, input[i].name, input[i].value);
                    }
                } else if (input[i].type.toLowerCase() == "checkbox") {
                    loader._setObjectProperty(result, input[i].name, input[i].checked ? input[i].value : "");
                }
                else {
                    loader._setObjectProperty(result, input[i].name, input[i].value);
                }
            }
        }
    },
    
    _readFormSelect: function(result, form) {
        var select = form.getElementsByTagName("SELECT");    
        for (var i = 0; i < select.length; i++) {
            if (select[i].name != null && select[i].name.length > 0) {
                loader._setObjectProperty(result, select[i].name, select[i].value);
            }
        }
    },
    
    _readFormTextArea: function(result, form) {
        var textarea = form.getElementsByTagName("TEXTAREA");    
        for (var i = 0; i < textarea.length; i++) {
            if (textarea[i].name != null && textarea[i].name.length > 0) {
                loader._setObjectProperty(result, textarea[i].name, textarea[i].value);
            }
        }
    },
    
    _setObjectProperty: function(object, name, value) {
        var o = object[name];
        if (o == null) {
            object[name] = value;
        } else {
            if (o instanceof Array) {
                o[o.length] = value;
            } else {
                object[name] = new Array(o, value);
            }
        }
    }
}
