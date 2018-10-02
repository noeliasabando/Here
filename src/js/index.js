var app_id =  "Yl3Ju4STECOUFEcGVC0a" ;
var app_code =  "To3xARYWWdfFlmrdJoKolw";
var currentLocation= {
  lat: -33.4726900,
  lng: -70.6472400,
};
//aqui empieza la geolocalizacion watchPosition Este método llamará a la función de éxito cada vez que cambie la posición del dispositivo.
function updatePosition (event) {
  currentLocation = {
    lat: event.coords.latitude,
    lng: event.coords.longitude,
  };
}

navigator.geolocation.watchPosition(updatePosition);

function formatTime(t) {
  var h = Math.floor(t / 3600);
  var m = Math.floor((t % 3600) / 60);
  var s = t % 60;
  (h < 10) ? h = "0" + h : h;
  (m < 10) ? m = "0" + m : m;
  (s < 10) ? s = "0" + s : s;
  return h + ":" + m + ":" + s;
}
/**
  Returns the user selected time from 0-24 hrs for route prediction
*/
function getHours() {
  var timeSelector = document.getElementById("time_slider");
  var hours = (Math.ceil(timeSelector.value / 240 * 96) / 4);
  return hours;
}
/**
  Returns the time to be displayed in the control panel
*/
function getTimestamp() {
  // For example, 5.75 should return 05:45
  var hours = getHours();
  var hr = Math.floor(hours);
  var min = (hours % 1) * 60;
  if (hr < 10) { hr = "0" + hr;}
  if (min === 0) { min = "00"; }
  return hr + ':' + min;
}
/**
  Returns the time with seconds for fetching a tile
*/
function getTimestampSeconds() {
  // For example, 5.75 should return 05:45:00
  var timestamp = getTimestamp();
  return timestamp + ':00'
}
/**
  Returns the user selected day for route prediction
*/
function getDay() {
  var daySelector = document.getElementById("day_selector");
  var idx = daySelector.options[daySelector.selectedIndex].value;
  var weekday = parseInt(idx) * 24 * 60 * 60;
  return weekday;
}

/**
  Returns the user selected end location for route prediction
*/
function getDestinationLocation() {
  var endLocation = document.getElementById("destination");
  return endLocation;
}
// Trick to get historical date
function getHistoricalDate() {
  var td = new Date();
  return new Date(td.getFullYear(), td.getMonth(), td.getDate() + (0 - td.getDay() + 7));
}
/**
  Any errors, send them to console
*/
function onError(e) {
  console.log(e);
}
/**
  Handler for when the day or time onchange event to recalculate
  the route.
*/
function onDayTimeChange() {
  var weekday = getDay();
  var timestamp = getTimestamp();
  var timeSpan = document.getElementById("time_output");
  timeSpan.innerHTML = timestamp;
  route();
}
/**
  Handler for when start or end location has changed as indicated
  by the "return" key.
*/
function onLocationChange() {
  if (event.keyCode == 13) {
      startCoord = start.value;
      destCoord = destination.value;
     route();
  }
}
/**
  Will use geocoder to find starting coordinates
*/
function getStartLocation() {
  startCoords = currentLocation.lat + "," + currentLocation.lng;
  getEndLocation();
}
/**
  Will use geocoder to find ending coordinates
*/
function getEndLocation() {
  var end = document.getElementById("destination");
  geocoder.geocode({
      searchText: end.value,
      jsonattributes: 1
  }, onGetEndLocationSuccess, onError);
}
function onGetEndLocationSuccess(result) {
  var pos = result.response.view[0].result[0].location.displayPosition;
  endCoords = pos.latitude + "," + pos.longitude;
  getRouteFromStartToEnd(startCoords, endCoords)
}
/**
  Determine route from start to destination
*/
function getRouteFromStartToEnd(a, b) {
  var start = a.split(",");
  var end = b.split(",");
  // Create markers at the beginning and destination waypoints
  var startMarker = new H.map.Marker(new H.geo.Point(start[0], start[1]))
  var endMarker = new H.map.Marker(new H.geo.Point(end[0], end[1]))
  routeContainer.addObject(startMarker);
  routeContainer.addObject(endMarker);
  // Determine departure time based on user input
  // For example, routing request expects 2018-07-29T05:30:00
  var date = new Date();
  var departure = date.toISOString().slice(0,19);
  // Get fastest route by car with traffic
  // Prediction based on format... 2018-07-29T00:00:00
  var routeRequestParams = {
      mode: 'fastest;car;traffic:enabled',
      representation: 'display',
      routeattributes : 'waypoints,summary,shape,legs',
      waypoint0: a,
      waypoint1: b,
      departure: departure
  };
  router.calculateRoute(
      routeRequestParams,
      onGetRouteFromStartToEndSuccess,
      onError
  );
}

/**
  Update base and traffic times and draw the route.
*/
function onGetRouteFromStartToEndSuccess(result) {
  var route = result.response.route[0];
  var basetime = route.summary.baseTime;
  var traffictime = route.summary.trafficTime;  
  var strip = new H.geo.Strip();
  var routeShape = route.shape;
  routeShape.forEach(function(point) {
      var parts = point.split(',');
      strip.pushLatLngAlt(parts[0], parts[1]);
  });
  mapRoute = new H.map.Polyline(strip, {
      style: {
          lineWidth: 4,
          strokeColor: 'rgba(0, 128, 255, 0.7)'
      }
  });
  // Add the polyline to the map and zoom to put the route
  // in viewport
  routeContainer.addObject(mapRoute);
  map.setViewBounds(routeContainer.getBounds(), true);
}
/**
  Method to plot the route between waypoints and display
  predictions
*/
function route() {
  var direccion= document.getElementById("destination").value;
  document.getElementById("direccion").innerHTML= direccion;
  // Clear out any previous route state
  routeContainer.removeAll();
  getStartLocation();
}
/**
  Main functionality of the application
*/
function main() {
  // Initialize Platform Services (like Geocoding, Routing, and Traffic) with your credentials
  var secure = (location.protocol === 'https:') ? true : false;
  platform = new H.service.Platform({
      app_code: app_code,
      app_id: app_id,
      useCIT: true,        // run on customer integration testing environment
      useHTTPS: secure     // run on SSL if deploying to server
  });
  // If high resolution device, adjust default base map layer used in rendering
  var hidpi = ('devicePixelRatio' in window && devicePixelRatio > 1);
  var defaultLayers = platform.createDefaultLayers(hidpi ? 512 : 256, hidpi ? 320 : null);
  // Helper function to provide the URL endpoint that returns a specific tile
  // Note that we are using the normal.night style which gives it the dark
  // look for a given tile column, row, and zoom level
  // https://developer.here.com/documentation/maps/topics_api/h-map-provider-imagetileprovider-options.html#h-map-provider-imagetileprovider-options__geturl
  var date = getHistoricalDate();
  function getTrafficTileURL(col, row, level) {
      var time = (new Date).toISOString().slice(11,19) || "00:00:00";
      var ptime = date.getFullYear() + "-" + ("0"+(date.getMonth()+1)).slice(-2) + "-"  + ("0" + date.getDate()).slice(-2) + "T" + time + ".0000000"
      return ["https://",
          (1 + ((row + col) % 4)),
          ".traffic.maps.cit.api.here.com/maptile/2.1/traffictile/newest/normal.night/",
          level, "/",
          col, "/",
          row, "/",
          hidpi ? "512" : "256", "/",
          "png8",
          "?app_code=", app_code,
          "&app_id=", app_id,
          "&time=", ptime,
          hidpi ? "&ppi=320" : ""
        ].join("");
  }
  // Map Tile API can provide bitmap traffic tiles on demand
  // https://developer.here.com/documentation/maps/topics_api/h-map-provider-tileprovider.html
  var tileProvider = new H.map.provider.ImageTileProvider({
      label: "baselayer",
      descr: "",
      min: 1,
      max: 20,
      getURL: getTrafficTileURL,
  })
  // Map takes HTML element, base layer, and options in constructor
  // such as centering on the Bay Area and a zoom level
  // https://developer.here.com/documentation/maps/topics_api/h-map.html
  baseLayer = new H.map.layer.TileLayer(tileProvider);
  map = new H.Map(
      document.getElementById('mapContainer'),
      baseLayer,
      {
          center: new H.geo.Point(currentLocation.lat, currentLocation.lng),
          zoom: 12,
          pixelRatio: hidpi ? 2 : 1
      }
  );
  // Add expected user interactivity controls like zoom, pan, etc.
  behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
  ui = H.ui.UI.createDefault(map, defaultLayers);
  geocoder = platform.getGeocodingService();
  router = platform.getRoutingService();
  // When user resizes the window, resize the map viewport
  window.addEventListener('resize', function() { map.getViewPort().resize(); });
  // Groups give us a container for organizing map objects, such as the route
  // we want to follow for the given parameters.
  // https://developer.here.com/documentation/maps/topics_api/h-map-group.html
  routeContainer = new H.map.Group();
  map.addObject(routeContainer);
  route();
}
// Global variables used throughout this demo are not
// necessarily a best practice, but for this quick poc
var platform, map, behavior, ui, geocoder, router;
var routeContainer;
var startCoords, endCoords;
// Callback Control flow
// main() --> route() --> getStartLocation() -->
//   onGetStartLocationSuccess --> getEndLocation() -->
//   onGetEndLocationSuccess --> getRouteFromStartToEnd() -->
//   onGetRouteFromStartToEndSuccess()
main();