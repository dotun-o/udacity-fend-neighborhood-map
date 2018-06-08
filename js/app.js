function ViewModel() {
  var map, geocoder, infoWindow, infoPane;
  
  map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 34.033222, lng: -84.4709025},
    zoom: 12
  });

  geocoder = new google.maps.Geocoder();
  infoWindow = new google.maps.InfoWindow();
  infoPane = document.getElementById("info-pane");
  this.searchValue = ko.observable("");
  
  // this.filterMarkers = ko.computed(function() {
  //   for(var marker of markers) {
  //     if(marker.title.toLowerCase().includes(this.searchValue().toLowerCase())) {
  //       marker.setVisible(true);
  //     }
  //     else {
  //       marker.setVisible(false);
  //     }
  //   }
  // });

  for(var marker of markers) {
    var markerInstance = new google.maps.Marker({
      map: map,
      position: {lat: marker.coords.lat, lng: marker.coords.lng}
    });

    google.maps.event.addListener(markerInstance, "mouseover", (function(marker) {
      return function() {
      infoWindow.setContent(marker.title);
      infoWindow.open(map, this);
      }
    })(marker));

    google.maps.event.addListener(markerInstance, "mouseout", (function() {
      return function() {
      infoWindow.close();
      }
    })(marker));

    google.maps.event.addListener(markerInstance, "click", (function(marker) {
      return function() {
        var infoPaneContent = infoPane.getElementsByClassName("info-pane-content")[0];
        var latLng = new google.maps.LatLng(marker.coords.lat, marker.coords.lng);
        
        // Get address from marker's lat-lng
        geocoder.geocode({location: latLng}, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            if(results[0]) {
              infoPaneContent.innerHTML = `
                                            <h3 class="location-name">${marker.title}</h3>
                                            <div class="location-address">${results[0].formatted_address}</div>
                                          `;
              infoPane.classList.add("open");
            }
          }
        });
      }
    })(marker));

    infoPane.getElementsByClassName("close")[0].addEventListener("click", () => {
      infoPane.classList.remove("open");
    });

    this.obMarkers = ko.observableArray(markers);
  }

  console.log("🎉 Map initialized. 🎉");
}

function mapError() {
  document.getElementById("map").innerText = "Map could not be initialized.";
}

function initMap() {
  ko.applyBindings(new ViewModel());
}
