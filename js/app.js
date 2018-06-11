function ViewModel() {
  var self, map, geocoder, infoWindow, locationsList, wikiUrl, infoPane;

  self = this;
  
  map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 34.033222, lng: -84.4709025},
    zoom: 12
  });
  self.pins = ko.observableArray([]);
  geocoder = new google.maps.Geocoder();
  infoWindow = new google.maps.InfoWindow();
  infoPane = document.getElementById("info-pane");
  locationsList = document.getElementById("locations-list");
  wikiUrl = "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*";
  self.query = ko.observable("");

  // map pins setup - instantiation, event listeners, Wikipedia link
  for(var marker of markers) {
    var markerInstance = new google.maps.Marker({
      map: map,
      position: {lat: marker.coords.lat, lng: marker.coords.lng},
      animation: google.maps.Animation.DROP,
    });
    
    // This needed to be set outside the instantiation
    // above in order to work properly
    markerInstance.title = ko.observable(marker.title);

    self.pins.push(markerInstance);

    // Open Google Maps' infoWindow
    google.maps.event.addListener(markerInstance, "mouseover", function() {
      infoWindow.setContent(this.title());
      infoWindow.open(map, this);
    });

    // close Google Maps' infoWindow
    google.maps.event.addListener(markerInstance, "mouseout", function() {
      infoWindow.close();
    });

    // pins load and open infoPane
    google.maps.event.addListener(markerInstance, "click", function() {
      var infoPaneContent = infoPane.getElementsByClassName("info-pane-content")[0];
      infoPaneContent.innerHTML = "";

      var latLng = new google.maps.LatLng(this.position.lat(), this.position.lng());
      var closureTitle = this.title();

      // bounce pin
      this.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout((function() {
          this.setAnimation(null);
        }).bind(this), 1000);
      
      // get address from pin's lat-lng
      geocoder.geocode({location: latLng}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          if(results[0]) {
            infoPaneContent.innerHTML = `
                                          <h3 class="location-name">${closureTitle}</h3>
                                          <div class="location-address">${results[0].formatted_address}</div>
                                        `;
            // get Wikipedia link
            fetch(wikiUrl + "&titles=" + closureTitle)
              .then(function(response) {
              return response.json();
              })
              .then(function(data) {
                if(data.query.pages[0].pageid) {
                  infoPaneContent.innerHTML += `<div class="wiki-link"><a href="https://en.wikipedia.org/?curid=${data.query.pages[0].pageid}" target="_blank">Wikipedia</a></div>`;
                }
              })
              .catch(function(error) {
                console.log(error);
              });

            infoPane.classList.add("open");
          }
        }
      });
    });

    // close infoPane
    infoPane.getElementsByClassName("close")[0].addEventListener("click", () => {
      infoPane.classList.remove("open");
    });
  } // end pins instantiation

  // trigger pin when matching list item is clicked
  triggerClickOnPin = function(data, event) {
    var matchingPin = self.pins().filter(function(pin) {
      return pin.title().toLowerCase() === event.target.innerHTML.toLowerCase();
    })[0];

    if(matchingPin) {
      google.maps.event.trigger(matchingPin, "click");
    }
  }

  // filter pins and locations list
  self.filteredPins = ko.computed(function() {
    // filter pins
    filterPins();

    // filter locations list
    if(!self.query()) {
      return self.pins();
    }

    return self.pins().filter(function(pin) {
      return pin.title()
      .toLowerCase()
      .includes(self.query()
                    .trim()
                    .toLowerCase());
    });
    
  });

  // filter pins
  function filterPins() {
    for(var pin of self.pins()) {
      if(pin.title().toLowerCase().includes(self.query().trim().toLowerCase())) {
        pin.setVisible(true);
      }
      else {
        pin.setVisible(false);
      }
    }
  }

  console.log("🎉 Map initialized. 🎉");
}

function mapError() {
  document.getElementById("map").innerText = "Map could not be initialized.";
}

function initMap() {
  ko.applyBindings(new ViewModel());
}
