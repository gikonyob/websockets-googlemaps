var map;
var markers = [];
var image;
var nairobi = {lat: -1.2920, lng: 36.8219};
var mapInterval;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: nairobi,
        mapTypeId: 'terrain'
    });
    var image = {
    url: 'http://www.free-icons-download.net/images/user-icon-32327.png',
    size: new google.maps.Size(20, 32),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 32)
  };
    mapInterval = setInterval(function(){ getCurrentPos(); }, 1000);
}

function getCurrentPos(){
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            nairobi = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            setMarker(getCookie("user_name"), nairobi);
            send_data(nairobi);
        });
    }
}

function checkMarker(username){
    var exists = false;
    for(var i=0; i<markers.length; i++){
        if(markers[i].username === username){
            exists = true;
        }
    }
    return exists;
}

function getMarker(username){
    var markerObj = null;
    for(var i=0; i<markers.length; i++){
        if(markers[i].username === username){
            markerObj = markers[i].marker;
        }
    }
    return markerObj;
}

function setMarker(username, location) {
    var newPosition = new google.maps.LatLng(location.lat, location.lng);
    if(checkMarker(username)){
        mark = getMarker(username);
        mark.animateTo(newPosition); 
    }else{
        var marker = new google.maps.Marker({
          position: newPosition,
          icon: image,
          map: map,
          title: username
        });
        markers.push({username: username, marker: marker});
    }
}

function getIndex(username){
    var ind;
    for(var i=0; i<markers.length; i++){
        if(markers[i].username === username){
            ind = i;
        }
    }
    return ind;
}

function removeMarker(username){
    if(checkMarker(username)){
        var ind;
        mark = getMarker(username);
        ind = getIndex(username);
        console.log(ind);
        mark.setMap(null);
        markers.splice(ind, 1);
    }
}