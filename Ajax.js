
; (function (root, factory) {
    
    if (typeof module === 'object' && module.exports) {
        //commonJS规范
        exports = module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        //AMD
        define('Ajax', factory)
    } else {
        //浏览器
        root.Ajax = factory();
    }
}(this, function () {
    'use strict'

    function extend(source) {
        
        var argsLen = arguments.length;

        if (argsLen === 0) return null;
        
        if (argsLen === 1 && (isNull(source) || isUndefined(source)))   return null;
       
        var target = {};
        for(var i=0;i< argsLen;i++){
            source =arguments[i];
            _extend(target, source);
        }
        return target;
    }
    function _extend(target, source) {

        for (var k in source) {

            if (source.hasOwnProperty(k)) {
                var prop = source[k];        // 避免相互引用对象导致死循环，如initalObj.a = initalObj的情况

                if (prop === target) {
                    continue;
                }
                if (typeof prop === 'object') {
                    target[k] = isArray(prop) ? [] : {};
                    if (isUndefined(prop) || isNull(prop)) {
                        target[k] = prop;
                    } else {
                        extend(target[k], prop);
                    }
                } else {

                    target[k] = prop;
                }
            }
        }
    }
    function isEmpty(value) {
        if(value === undefined || value === null){
            return true;
        }
        if(isArray(value) && value.length === 0){
            return true;
        }
        for(var key in value){
            if(value.hasOwnProperty(key)){
                return false;
            }
            return true;
        }
        return true;
    }
    function isString(value){
        return Object.prototype.toString.call(value) === '[object String]';
    }
    function isFormData(value){
        return Object.prototype.toString.call(value) === '[object FormData]';
    }
    function isFunction(value) {
        return Object.prototype.toString.call(value) === '[object Function]';
    }
    function isBool(value) {
        return Object.prototype.toString.call(value) === '[object Boolean]';
    }
    function isArray(value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    }
    function isNull(value) {
        return Object.prototype.toString.call(value) === '[object Null]';
    }
    function isUndefined(value) {
        return Object.prototype.toString.call(value) === '[object Undefined]';
    }
    function isObject(value) {
        var type = typeof value;
        return !!value && (type === 'object' || type === 'function')
    }

    var transform = {
        serialize:function(data){
            var _data = [];
            if(!isEmpty(data)){
                
                if(isString(data)) return data;

                for(var k in data){
                    if(data.hasOwnProperty(k)){
                        _data.push(encodeURIComponent(k)+'='+encodeURIComponent(data[k]))
                    }
                }
                return _data.join('&');
            }
            return null;
        },
        serializeObject:function(str){
            if(isEmpty(str)) return {};
            var pars = str.split('&');
            var result = {};
            for(var i =0 ,len = pars.length; i < len ;i++){
                var par = pars[i];
                var kv = par.split('=');
                if(!kv[0]) continue;
                result[kv[0]] = kv[1];
            }
            return result;
        },
        resolveData: function (method,data,url) {
            var upperMethod = method.toUpperCase();
            var _data = null;
            
            _data = this.serialize(data);
            
            if((upperMethod === 'GET' || upperMethod === 'HEAD') && _data != null){
                url += url.lastIndexOf('?') > -1?'&'+_data:'?'+_data;
            }
            return { data : _data,  url:url  }
         }
    }


    
    var Ajax = function () {
        var xhr = null;

        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else {
            // IE6, IE5 浏览器执行代码
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }

        var settings = {
            url: location.pathname,  //默认当前路径
            type: 'GET',             //请求方式
            async: true,             //true表示异步 false表示同步
            cache: true,             //缓存
            //text/plain; charset=x-user-defined
            //text/html;charset=UTF-8
            //application/xml;charset=UTF-8
            //application/json;charset=UTF-8
            //multipart/form-data; boundary=[xxx]
            contentType: 'application/x-www-form-urlencoded;charset=utf-8',
            crossDomain: false,      //同域请求为false， 跨域请求为true
            data: null,              //发送到服务器的数据
            dataType: '',           //从服务器返回你期望的数据类型arraybuffer,blob,document,json,text,
            headers: {},             //一个额外的"{键:值}"对映射到请求一起发送
            statusCode: {},          //一个 HTTP响应状态码
            timeout: 0,              //设置请求超时时间（毫秒）。值为0表示没有超时,
            beforeSend: function (xhr) { },                        //发送之前设置相关属性,返回false将终止请求
            success: function (data, statusText, xhr) { },            //成功回调
            error: function (xhr, textStatus, errorThrown) { },       //失败回调
            complete: function (xhr, textStatus) { }                 //请求完成回调
        }

        var statusCode = {
            200: function (statusText) { },
            300: function (statusText) { }
        }


        var self = this;
            
        var  setup = function (_settings) {
            // var options = {};
            var options = extend({}, settings, _settings);
            //FormData 数据不要转化
            
            options.data = _settings.data;
            return options;
        }
        this.abort = function () {
            !!xhr && xhr.abort();
        }
        this.getJSONP =function(url,sccess,error,timeout){
            var self = this;
            var script = document.createElement('script');

            var timeName = new Date().getTime() + Math.round(Math.random() * 1000),
            timer = null,
            _callback = "JSONP_" + timeName;
    
            if(url.lastIndexOf('callback=?') > -1){
                url = url.replace(/callback=\?/,'');
            }
           
            script.src = url + (url.indexOf("?") > -1 ? "&" : "?") + "callback=" + _callback;
            script.type = "text/javascript";
            document.body.appendChild(script);
    
            
            window[_callback] = function(data){
                delete window[_callback]
                timer && clearTimeout(timer);
                sccess && sccess(data);
                document.body.removeChild(script);
            }
            if(timeout && timeout > 0){
                timer = setTimeout(function(){
                    error && error(xhr,'timeout')
                },timeout);
            }

            return this;
            
        },
        this.ajax = function (options) {

 
            var settings = setup(options || {});
            
            var isJSONP = ((settings.dataType && (settings.dataType === 'jsonp' || settings.dataType === 'script')) || (settings.url.lastIndexOf('?callback=?') > -1 || settings.url.lastIndexOf('&callback=?') > -1));

            if(isJSONP){
                //jsonp
                return this.getJSONP(settings.url,settings.success,settings.error,settings.timeout);
                
            }
            

            if (isBool(settings.crossDomain) && settings.crossDomain) {
                //跨域请求xhr.withCredentials 设置为true
                //服务端必须设置 Access-Control-Allow-Origin 
                //server端(response header)要设置 Access-Control-Allow-Credentials = true,可携cookie
                //Access-Control-Expose-Headers 该项确定XmlHttpRequest2对象当中getResponseHeader()方法所能获得的额外信息
                //Access-Control-Expose-Headers 可以获取的信息  Cache-Control ,Content-Language,Content-Type,Expires,Last-Modified,Pragma
                xhr.withCredentials = true;
            }

            var url = settings.url,
                data = settings.data;
            var _contentType = settings.contentType;

            if(!isFormData(data) && !/multipart\/form-data/.test(_contentType)){
                var resolveData = transform.resolveData(settings.type,data,url);
                data = resolveData.data;
                url = resolveData.url;
            }else{
                //如果是FormData,设置content-type

                if(_contentType && !/multipart\/form-data\s*;\s*boundary\s*=[\s\S]+/.test(_contentType)){
                    //var boundary = new Date().getTime()+'';
                    settings.contentType = null;//会自动设置'multipart/form-data; boundary=['+boundary+']';
                }

                //当data不是FormData对象的时候将data转换为FormData
                if(!isFormData(data) && !isEmpty(data)){
                    var _data = new FormData();

                    if(isString(data)){
                        data = serializeObject(data);
                    }

                    for(var k in data){
                        if(data.hasOwnProperty(k)){
                            _data.append(encodeURIComponent(k),encodeURIComponent(data[k]));
                        }
                    }
                    data = _data;
                }
            }

            xhr.open(settings.type,url, settings.async);

            xhr.responseType = settings.dataType || '';

            //setRequestHeader 必须在open之后 send之前调用
            if (!!settings.headers) {
                var headers = settings.headers;
                for (var header in headers) {
                    if(headers.hasOwnProperty(header)){
                        xhr.setRequestHeader(header, headers[header]);
                    }
                }
            }
            if (!!_contentType) {
                xhr.setRequestHeader('Content-Type', _contentType);
            }

            if (!!settings.beforeSend && isFunction(settings.beforeSend)) {
                var isContinue = settings.beforeSend(xhr);
                if (isBool(isContinue) && !isContinue) {
                    xhr.abort();
                    //取消
                    return isContinue;
                }
            }
            if (isBool(settings.async) && settings.async === false) {
                // 同步 
                // xhr.timeout必须为0
                // xhr.withCredentials必须为 false
                // xhr.responseType必须为""（注意置为"text"也不允许）
                xhr.timeout = 0;
                xhr.withCredentials = false;
                xhr.responseType = '';
            } else {
                xhr.timeout = settings.timeout || 0;//在IE中，超时属性只能在调用 open() 方法之后且在调用 send() 方法之前设置。
            }

            
            // get和head请求要处理数据
            try {
                
                xhr.send(data); 

            } catch (error) {

                if (!!settings.error && isFunction(settings.error)) {
                    settings.error(xhr, error);
                }
            }

            function _complete(){
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                    
                    if (!!settings.success && isFunction(settings.success)) {
                        settings.success(xhr.response, xhr.statusText, xhr)
                    }

                } else {
                    if (!!settings.error && isFunction(settings.error)) {
                        settings.error(xhr, xhr.statusText,xhr.status);
                    }
                }
            }
            

            // xhr.readyState
            // 值	状态	描述
            // 0	UNSENT (初始状态，未打开)	此时xhr对象被成功构造，open()方法还未被调用
            // 1	OPENED (已打开，未发送)	open()方法已被成功调用，send()方法还未被调用。注意：只有xhr处于OPENED状态，才能调用xhr.setRequestHeader()和xhr.send(),否则会报错
            // 2	HEADERS_RECEIVED (已获取响应头)	send()方法已经被调用, 响应头和响应状态已经返回
            // 3	LOADING (正在下载响应体)	响应体(response entity body)正在下载中，此状态下通过xhr.response可能已经有了响应数据
            // 4	DONE (整个数据传输过程结束)
            xhr.onreadystatechange = function () {

                if (xhr.readyState === 4) {

                    if (xhr.onload === undefined) {
                        //ie8 下面没有onload事件
                        _complete();
                    }
                }
            }
            /* xhr.onloadstart = function (event) {
                //send方法调用之后回调
            }
            xhr.upload.onloadstart = function (event) {

            }
            xhr.upload.onprogress = function (event) {
                // 在上传阶段(即xhr.send()之后，xhr.readystate=2之前)触发，每50ms触发一次
            }
            xhr.upload.onload = function (event) {

            }

            xhr.upload.onloadend = function (event) {

            }
            xhr.upload.onabort = function (event) {

            }
            xhr.upload.ontimeout = function (event) {

            }
            xhr.upload.onerror = function (event) {

            }
            xhr.onprogress = function (event) {
                
                // xhr.onprogress在下载阶段（即xhr.readystate=3时）触发，每50ms触发一次
            } */
            xhr.onload = function (event) {
                
                // 当请求成功完成时触发，此时xhr.readystate=4
                _complete();
            }
            xhr.onloadend = function (event) {
                 // 当请求结束（包括请求成功和请求失败）时触发
                 
                if (!!settings.complete && isFunction(settings.complete)) {
                    settings.complete(xhr, xhr.statusText);
                }

                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {

                    //返回正确的时候的状态码处理
                    if (!!settings.statusCode && !!settings.statusCode[xhr.status]) {
                        settings.statusCode[xhr.status].call(this, xhr.response, xhr.statusText, xhr);
                    }
                } else {

                    //返回错误的的时候的状态码处理
                    if (!!settings.statusCode && !!settings.statusCode[xhr.status]) {
                        settings.statusCode[xhr.status].call(this, xhr, xhr.statusText,xhr.status);
                    }
                }
               
            }
            xhr.onabort = function (event) {
                //当调用xhr.abort()后触发
                if (!!settings.error && isFunction(settings.error)) {
                    settings.error(xhr, 'abort');
                }
            }
            xhr.ontimeout = function (event) {
                 
                // xhr.timeout不等于0，由请求开始即onloadstart开始算起，当到达xhr.timeout所设置时间请求还未结束即onloadend，
                //则触发此事件
                if (!!settings.error && isFunction(settings.error)) {
                    settings.error(xhr, 'timeout');
                }
            }
            xhr.onerror = function (event) {
                
                // 在请求过程中，若发生Network error则会触发此事件（若发生Network error时，上传还没有结束，
                // 则会先触发xhr.upload.onerror，再触发xhr.onerror；若发生Network error时，上传已经结束，则只会触发xhr.onerror）。
                //注意，只有发生了网络层级别的异常才会触发此事件，对于应用层级别的异常，如响应返回的xhr.statusCode是4xx时，
                // 并不属于Network error，所以不会触发onerror事件，而是会触发onload事件
                if (!!settings.error && isFunction(settings.error)) {
                    settings.error(xhr, 'network error');
                }
            }

            return this;
        },
        this.get = function (url, data, callback, dataType) {

            if (isFunction(data)) {
                callback = data;
                data = undefined;
            }
            return this.ajax({
                url: url,
                type: 'GET',
                data: data,
                success: callback,
                dataType: dataType
            })
        },
        this.post = function (url, data, callback, dataType) {
            if (isFunction(data)) {
                callback = data;
                data = undefined;
            }
            return this.ajax({
                url: url,
                type: 'POST',
                data: data,
                success: callback,
                dataType: dataType
            })
        },
        this.getJSON = function (url, data, callback) {
            return this.get(url, data, callback, 'json');
        },
        this.getScript = function (url, callback) {
            return this.get(url, undefined, callback, 'script');
        }
    }

    Ajax.isFunction = isFunction;
    Ajax.isArray = isArray;
    Ajax.isBool = isBool;
    Ajax.isObject = isObject;
    Ajax.isUndefined = isUndefined;
    Ajax.isNull = isNull;
    Ajax.isEmpty = isEmpty;
    Ajax.extend = extend;

    return Ajax
}));