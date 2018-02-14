var ws = new WebSocket("ws://localhost:8080");
var type = "";
toastr.options.closeButton = true;
toastr.options.positionClass = "toast-bottom-left";
toastr.options.showDuration = "300";
toastr.options.hideDuration = "1000";
toastr.options.timeOut = "20000";
toastr.options.extendedTimeOut= "20000";
toastr.options.showEasing = "swing";
toastr.options.hideEasing = "linear";
toastr.options.showMethod = "fadeIn";
toastr.options.hideMethod = "fadeOut";

$.getScript = function(url, callback, cache){
  $.ajax({
    type: "GET",
    url: url,
    success: callback,
    dataType: "script",
    cache: cache
  });
};


function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkCookie(cname) {
    var value = getCookie(cname);
    if (value != "") {
       return true;
    } else {
        return false;
    }
}

function get_login(){
    document.body.className = "hold-transition login-page";
            document.body.innerHTML = '<div class="login-box">\
                            <div class="login-logo">\
                            <a>Google Maps Realtime Demo</a>\
                        </div>\
                        <!-- /.login-logo -->\
                        <div class="login-box-body">\
                        <p class="login-box-msg">Login to start your session</p>\
                            <form role="form">\
                            <div class="form-group has-feedback">\
                                <input type="text" class="form-control" placeholder="Username" id="username">\
                                <span class="glyphicon glyphicon-user form-control-feedback"></span>\
                            </div>\
                            <div class="form-group has-feedback">\
                                <input type="password" class="form-control" placeholder="Password" id="password">\
                                <span class="glyphicon glyphicon-lock form-control-feedback"></span>\
                            </div>\
                            <div class="row">\
                                <div class="col-xs-8" style="padding-top: 10px; padding-left: 30px;">\
                                <a onclick="get_register();">Register</a>\
                                </div>\
                                <!-- /.col -->\
                                <div class="col-xs-4">\
                                <button type="button" class="btn btn-primary btn-block btn-flat" onclick="send_login();">Login</button>\
                                </div>\
                                <!-- /.col -->\
                            </div>\
                            </form>\
                        </div>\
                        <!-- /.login-box-body -->\
                     </div>\
                        <!-- /.login-box -->\
                        <!-- jQuery 3 -->\
                        <script src="bower_components/jquery/dist/jquery.min.js"></script>\
                        <!-- Bootstrap 3.3.7 -->\
                        <script src="bower_components/bootstrap/dist/js/bootstrap.min.js"></script>';
}

function get_register(){
    document.body.innerHTML = '<div class="login-box">\
                        <div class="login-logo">\
                            <a>Google Maps Realtime Demo</a>\
                        </div>\
                        <!-- /.login-logo -->\
                        <div class="login-box-body">\
                            <p class="login-box-msg">Register to access the demo</p>\
                        <form role="form">\
                            <div class="form-group has-feedback">\
                                <input type="text" class="form-control" placeholder="Username" id="username">\
                                <span class="glyphicon glyphicon-user form-control-feedback"></span>\
                            </div>\
                            <div class="form-group has-feedback">\
                              <input type="password" class="form-control" placeholder="Password" id="password">\
                                <span class="glyphicon glyphicon-lock form-control-feedback"></span>\
                            </div>\
                            <div class="row">\
                                <div class="col-xs-8" style="padding-top: 10px; padding-left: 30px;">\
                                <a onclick="get_login();">Login</a>\
                            </div> \
                            <!-- /.col -->\
                            <div class="col-xs-4">\
                                <button type="button" class="btn btn-primary btn-block btn-flat" onclick="send_register();">Register</button>\
                            </div>\
                            <!-- /.col -->\
                            </div>\
                        </form>\
                        </div>\
                        <!-- /.login-box-body -->\
                        </div>\
                        <!-- /.login-box -->\
                        <!-- jQuery 3 -->\
                        <script src="bower_components/jquery/dist/jquery.min.js"></script>\
                    <!-- Bootstrap 3.3.7 -->\
                    <script src="bower_components/bootstrap/dist/js/bootstrap.min.js"></script>';
}

function get_map(){
    var x = document.createElement("STYLE");
    x.type = "text/css";
    var t = document.createTextNode("#map {height: 100%;} html, body {height: 100%;margin: 0;padding: 0;}");
    x.appendChild(t);
    document.head.appendChild(x);
    document.body.className = "";
    document.body.innerHTML = '<div id="map"></div>\
    <button style="background-color: #ffffff;bottom:20px;left:8px; position:absolute;z-index: 9999; padding-top: 5px;padding-left: 10px;padding-bottom: 5px;padding-right: 10px;" onclick="send_logout();">\
    Logout</button>';
    $.getScript( "http://localhost/client/gmaps.js", function() {
                $.getScript("https://maps.googleapis.com/maps/api/js?key=API_KEY&callback=initMap", function() {
                    $.getScript("http://localhost/client/markerAnimate.js", function() {}, true);
                }, true);
            }, true);
}

ws.onmessage = function(e) {
 	var data = JSON.parse(e.data);
 	if(data.type==='connection'){
 		if(navigator.cookieEnabled===false){
 			setTimeout(function(){ toastr.warning("Please enable cookies on your browser"); }, 25000);
 		}
        if(checkCookie("user_name") && checkCookie("token")){
            get_map();
        }else{
            get_login();
        }
        toastr.success(data.message);
 	}else if(data.type==='register'){
        get_login();
        toastr.success(data.message);
 	}else if(data.type==='login'){
 		document.cookie = "user_name="+data.user_name;
        document.cookie = "token="+data.token;
        get_map();     
 	}else if(data.type==='data'){
        setMarker(data.user_name, data.coordinates);
 	}else if(data.type==='logout'){
        document.cookie = "user_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        get_login();
 		toastr.success(data.message);
 	}else if(data.type==='removed'){
       removeMarker(data.user_name);
       toastr.warning(data.user_name + " left.");
    }else if(data.type==='error'){
 		toastr.error(data.message);
        if(data.message === "Not Logged In"){
            get_login();
        }
 	}
}

ws.onclose = function(e) {
  get_login();
 	toastr.error("Connection Closed");
}

function send_register() {
 	var usernameField = document.getElementById('username');
 	var passwordField = document.getElementById('password');
 	if(ws.readyState === WebSocket.OPEN) {
 		ws.send(JSON.stringify({
 			"type": "register", 
 			"user_name": usernameField.value, 
 			"password": passwordField.value
 		}));
 	}
}

function send_login() {
 	var usernameField = document.getElementById('username');
 	var passwordField = document.getElementById('password');
 	if(ws.readyState === WebSocket.OPEN) {
 		ws.send(JSON.stringify({
 			"type": "login", 
 			"user_name": usernameField.value, 
 			"password": passwordField.value
 		}));
 	}
}

function send_data(pos) {
 	if(ws.readyState === WebSocket.OPEN) {
 		ws.send(JSON.stringify({
 			"type": "data", 
 			"user_name": getCookie("user_name"),
 			"token": getCookie("token"), 
 			"coordinates": {lat: pos.lat, lng: pos.lng}
 		}));
 	}
}

function send_logout() {
    clearInterval(mapInterval);
 	if(ws.readyState === WebSocket.OPEN) {
 		ws.send(JSON.stringify({
 			"type": "logout", 
 			"user_name": getCookie("user_name"),
 			"token": getCookie("token")
 		}));
 	}
}
