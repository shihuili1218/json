var getXMLPrefix = function (prefixIndex) {  
    var span = '    ';  
    var output = [];  
    for(var i = 0 ; i < prefixIndex; ++i)  
    {  
        output.push(span);  
    }  

    return output.join('');  
};




var parseXML = function (text) {
     //去掉多余的空格  
    text = '\n' + text.replace(/(<\w+)(\s.*?>)/g,function($0, name, props)  
    {  
        return name + ' ' + props.replace(/\s+(\w+=)/g," $1");  
    }).replace(/>\s*?</g,">\n<");  
    //把注释编码  
    text = text.replace(/\n/g,'\r').replace(/<!--(.+?)-->/g,function($0, text)  
    {  
        var ret = '<!--' + escape(text) + '-->';  
        return ret;  
    }).replace(/\r/g,'\n');  
    //调整格式  
    var rgx = /\n(<(([^\?]).+?)(?:\s|\s*?>|\s*?(\/)>)(?:.*?(?:(?:(\/)>)|(?:<(\/)\2>)))?)/mg;  
    var nodeStack = [];  
    var output = text.replace(rgx,function($0,all,name,isBegin,isCloseFull1,isCloseFull2 ,isFull1,isFull2){  
        var isClosed = (isCloseFull1 == '/') || (isCloseFull2 == '/' ) || (isFull1 == '/') || (isFull2 == '/');  
        var prefix = '';  
        if(isBegin == '!') {  
            prefix = getXMLPrefix(nodeStack.length);  
        } else {  
            if(isBegin != '/') {  
                prefix = getXMLPrefix(nodeStack.length);  
                if(!isClosed) {  
                    nodeStack.push(name);  
                }  
            } else {  
                nodeStack.pop();  
                prefix = getXMLPrefix(nodeStack.length);  
            }  

        }  
        var ret =  '\n' + prefix + all;  
        return ret;  
    });  

    var prefixSpace = -1;  
    var outputText = output.substring(1);  
    //把注释还原并解码，调格式  
    outputText = outputText.replace(/\n/g,'\r').replace(/(\s*)<!--(.+?)-->/g,function($0, prefix,  text) {  
        if(prefix.charAt(0) == '\r')  
            prefix = prefix.substring(1);  
        text = unescape(text).replace(/\r/g,'\n');  
        var ret = '\n' + prefix + '<!--' + text.replace(/^\s*/mg, prefix ) + '-->';  
        return ret;  
    });  
    
    outputText= outputText.replace(/\s+$/g,'').replace(/\r/g,'\r\n');  
    return outputText;
};

var validateXML = function (xmlContent) { 
    //errorCode 0是xml正确，1是xml错误，2是无法验证 
    var xmlDoc,errorMessage,errorCode = 0; 
    var errorLine, errorStart, errorEnd = 0;
    // code for IE 
    if (window.ActiveXObject) { 
        xmlDoc  = new ActiveXObject("Microsoft.XMLDOM"); 
        xmlDoc.async="false"; 
        xmlDoc.loadXML(xmlContent); 
 
        if(xmlDoc.parseError.errorCode!=0) { 
            errorMessage="code: " + xmlDoc.parseError.errorCode + "\n"; 
            errorMessage=errorMessage+"reason: " + xmlDoc.parseError.reason; 
            errorLine = xmlDoc.parseError.line;
            errorCode = 1; 
        } else { 
            errorMessage = "格式正确"; 
        } 
    } 
    // code for Mozilla, Firefox, Opera, chrome, safari,etc. 
    else if (document.implementation.createDocument) { 
        var parser = new DOMParser(); 
        xmlDoc = parser.parseFromString(xmlContent,"text/xml"); 
        var error = xmlDoc.getElementsByTagName("parsererror"); 
        if (error.length > 0) {
               if(xmlDoc.documentElement.nodeName=="parsererror") { 
                errorCode = 1; 
                errorMessage = xmlDoc.documentElement.childNodes[0].nodeValue; 
            } else { 
                errorCode = 1; 
                errorMessage = xmlDoc.getElementsByTagName("parsererror")[0].textContent; 
                var lineMatches = errorMessage.match(/line ([0-9]*)/);
                if (lineMatches && typeof lineMatches === "object" && lineMatches.length > 1) {
                    errorLine = parseInt(lineMatches[1], 10);
                }
                
                if(errorLine === 0){
                    errorStart = 0;
                }else{
                	var lines = xmlContent.split("\n");
                	error = lines[errorLine-1];
                	errorStart = xmlContent.indexOf(error);
                }
                
                errorEnd = xmlContent.indexOf("\n", errorStart);
            }
        } else { 
            errorMessage = "格式正确"; 
        }
    } else { 
        errorCode = 2; 
        errorMessage = "浏览器不支持验证，无法验证xml正确性"; 
    } 
    return { 
        "msg":errorMessage,  
        "errorCode":errorCode,
        "errorLine": errorLine,
        "errorStart": errorStart,
        "errorEnd": errorEnd
    }; 
};



