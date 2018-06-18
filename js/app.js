"use strict";

function ViewModel() {
  var self, map, geocoder, infoWindow, wikiUrl, infoPane;

  self = this;
  
  map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 34.033222, lng: -84.4709025},
    zoom: 12
  });
  self.pins = ko.observableArray([]);
  geocoder = new google.maps.Geocoder();
  infoWindow = new google.maps.InfoWindow();
  infoPane = document.getElementById("info-pane");
  wikiUrl = "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*";
  self.query = ko.observable("");
  self.infoPaneText = ko.observable("");

  // map pins setup - instantiation, event listeners, Wikipedia link
  for(var marker of markers) {
    var markerInstance = createMapPin(marker, map);
    
    // This needs to be set outside the instantiation
    // above in order to work properly
    if(markerInstance) {
      markerInstance.title = marker.title;
    }

    self.pins.push(markerInstance);

    google.maps.event.addListener(markerInstance, "mouseover", openInfoWindow);
    google.maps.event.addListener(markerInstance, "mouseout", closeInfoWindow);
    google.maps.event.addListener(markerInstance, "click", loadAndOpenInfoPane);
    infoPane.getElementsByClassName("close")[0].addEventListener("click", closeInfoPane);
  }

  // Create map pin
  function createMapPin(pinDataSource, targetMap) {
    if("coords" in pinDataSource && "gm_accessors_" in map) {
      return new google.maps.Marker({
        map: targetMap,
        position: {lat: pinDataSource.coords.lat, lng: pinDataSource.coords.lng},
        animation: google.maps.Animation.DROP,
      });
    }

    // Error handling if argument(s) is/are invalid
    alert("There was a problem loading the map pins.")
  }

  // Open Google Maps' infoWindow
  function openInfoWindow() {
    infoWindow.setContent(this.title);
    infoWindow.open(map, this);
  }

  // close Google Maps' infoWindow
  function closeInfoWindow() {
    infoWindow.close();
  }

  // load and open infoPane
  function loadAndOpenInfoPane() {
    var latLng = new google.maps.LatLng(this.position.lat(), this.position.lng());
    var closureTitle = this.title;

    // bounce pin
    this.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout((function() {
        this.setAnimation(null);
      }).bind(this), 1000);
    
    // get address from pin's lat-lng
    geocoder.geocode({location: latLng}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        if(results[0]) {
          // get Wikipedia link
          fetch(wikiUrl + "&titles=" + closureTitle)
            .then(function(response) {
            return response.json();
            })
            .then(function(data) {
              // we got a valid Wikipedia ID
              if(data.query.pages[0].pageid) {
                self.infoPaneText(`
                                  <h3 class="location-name">${closureTitle}</h3>
                                  <div class="location-address">${results[0].formatted_address}</div>
                                  <div class="wiki-link"><a href="https://en.wikipedia.org/?curid=${data.query.pages[0].pageid}" target="_blank">Wikipedia</a></div>
                                `);
              }
              // we didn't get a valid Wikipedia ID
              else {
                self.infoPaneText(`
                                  <h3 class="location-name">${closureTitle}</h3>
                                  <div class="location-address">${results[0].formatted_address}</div>
                                  <div class="wiki-link">A Wikipedia link was not found for this location</div>
                                `);
              }
            })
            .catch(function(error) {
              // the request itself failed e.g. network error
              self.infoPaneText(`
                                <h3 class="location-name">${closureTitle}</h3>
                                <div class="location-address">${results[0].formatted_address}</div>
                                <div class="wiki-link">Unable to fetch Wikipedia link</div>
                              `);
            });

          infoPane.classList.add("open");
        }
      }
    });
  }

  // populate infoPane
  self.populateInfoPane = ko.computed(function() {
    return self.infoPaneText();
  });

  // close infoPane
  function closeInfoPane() {
    infoPane.classList.remove("open");
  }

  // trigger pin when matching list item is clicked
  self.triggerClickOnPin = function(data, event) {
    var matchingPin = self.pins().filter(function(pin) {
      return pin.title.toLowerCase() === data.title.toLowerCase();
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
      return pin.title
      .toLowerCase()
      .includes(self.query()
                    .trim()
                    .toLowerCase());
    });
    
  });

  // filter pins
  function filterPins() {
    for(var pin of self.pins()) {
      if(pin.title.toLowerCase().includes(self.query().trim().toLowerCase())) {
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
  window.alert("Map could not be initialized.");
}

function initMap() {
  ko.applyBindings(new ViewModel());
}
