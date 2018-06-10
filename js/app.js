function ViewModel() {
  var self, map, pins, geocoder, infoWindow, infoPane;

  self = this;
  
  map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 34.033222, lng: -84.4709025},
    zoom: 12
  });
  pins = [];
  geocoder = new google.maps.Geocoder();
  infoWindow = new google.maps.InfoWindow();
  infoPane = document.getElementById("info-pane");
  self.query = ko.observable("");

  for(var marker of markers) {
    var markerInstance = new google.maps.Marker({
      map: map,
      title: marker.title,
      position: {lat: marker.coords.lat, lng: marker.coords.lng},
      animation: google.maps.Animation.DROP,
    });

    pins.push(markerInstance);

    google.maps.event.addListener(markerInstance, "mouseover", function() {
      infoWindow.setContent(this.title);
      infoWindow.open(map, this);
    });

    google.maps.event.addListener(markerInstance, "mouseout", function() {
      infoWindow.close();
    });

    google.maps.event.addListener(markerInstance, "click", function() {
      var infoPaneContent = infoPane.getElementsByClassName("info-pane-content")[0];
      var latLng = new google.maps.LatLng(this.position.lat(), this.position.lng());
      var closureTitle = this.title;
      
      // Get address from pin's lat-lng
      geocoder.geocode({location: latLng}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          if(results[0]) {
            infoPaneContent.innerHTML = `
                                          <h3 class="location-name">${closureTitle}</h3>
                                          <div class="location-address">${results[0].formatted_address}</div>
                                        `;
            infoPane.classList.add("open");
          }
        }
      });
    });

    infoPane.getElementsByClassName("close")[0].addEventListener("click", () => {
      infoPane.classList.remove("open");
    });
  }

  self.filteredPins = ko.computed(function() {
    for(var pin of pins) {
      if(pin.title.toLowerCase().includes(self.query().trim().toLowerCase())) {
        pin.setVisible(true);
      }
      else {
        pin.setVisible(false);
      }
    }
  });

  console.log("🎉 Map initialized. 🎉");
}

function mapError() {
  document.getElementById("map").innerText = "Map could not be initialized.";
}

function initMap() {
  ko.applyBindings(new ViewModel());
}
