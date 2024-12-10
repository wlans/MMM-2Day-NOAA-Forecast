Module.register("MMM-2Day-NOAA-Forecast", {
  defaults: {
    lat: 0.0,
    lon: 0.0,
    units: "metric",
    interval: 600000, // Every 10 mins
  },

  start: function () {
    Log.log(`Starting module: ${this.name}`);
    this.units = this.config.units;
    this.loaded = false;
    this.url = `https://api.weather.gov/points/${this.config.lat},${this.config.lon}`;
    this.forecast = [];
    this.getWeatherData(this);
  },

  getStyles: function () {
    return ["font-awesome.css", "MMM-2Day-NOAA-Forecast.css"];
  },

  getDom: function () {
    let wrapper = document.createElement("table");
    wrapper.className = "forecast small";
    wrapper.style.cssText = "border-spacing: 5px";

    if (this.loaded && this.forecast.length) {
      // Generate headers dynamically
      let headerRow = document.createElement("tr");
      this.forecast.forEach((period) => {
        let th = document.createElement("th");
        th.className = "forecast-title";
        th.innerHTML = period.name;
        headerRow.appendChild(th);
      });
      wrapper.appendChild(headerRow);

      // Generate forecast icons
      let iconRow = document.createElement("tr");
      this.forecast.forEach((period) => {
        let td = document.createElement("td");
        td.className = "forecast-day-night";
        let img = document.createElement("img");
        img.src = period.icon;
        img.alt = period.shortForecast;
        img.className = "forecast-icon";
        td.appendChild(img);
        iconRow.appendChild(td);
      });
      wrapper.appendChild(iconRow);

      // Generate forecast texts
      let textRow = document.createElement("tr");
      this.forecast.forEach((period) => {
        let td = document.createElement("td");
        td.className = "forecast-text";
        td.innerHTML = period.shortForecast;
        textRow.appendChild(td);
      });
      wrapper.appendChild(textRow);

      // Generate forecast details
      let detailRow = document.createElement("tr");
      this.forecast.forEach((period) => {
        let td = document.createElement("td");
        td.className = "forecast-detail";

        // Temperature
        let tempIcon = document.createElement("i");
        tempIcon.className = `fa ${period.isDaytime
            ? "fa-temperature-three-quarters"
            : "fa-temperature-quarter"
          } fa-fw detail-icon`;
        let tempText = document.createElement("span");
        tempText.className = "detail-text";
        tempText.innerHTML = `${this.convertTemp(period.temperature)}`;
        td.appendChild(tempIcon);
        td.appendChild(tempText);
        td.appendChild(document.createElement("br"));

        // Precipitation Probability
        if (period.probabilityOfPrecipitation && period.probabilityOfPrecipitation.value !== null) {
          let rainIcon = document.createElement("i");
          rainIcon.className = "fa fa-umbrella fa-fw detail-icon";
          let rainText = document.createElement("span");
          rainText.className = "detail-text";
          rainText.innerHTML = `${period.probabilityOfPrecipitation.value} %`;
          td.appendChild(rainIcon);
          td.appendChild(rainText);
          td.appendChild(document.createElement("br"));
        }

        // Wind
        let windIcon = document.createElement("i");
        windIcon.className = "fa fa-wind fa-fw detail-icon";
        let windText = document.createElement("span");
        windText.className = "detail-text";
        windText.innerHTML = `${period.windSpeed} ${period.windDirection}`;
        td.appendChild(windIcon);
        td.appendChild(windText);

        detailRow.appendChild(td);
      });
      wrapper.appendChild(detailRow);
    } else {
      let loadingDiv = document.createElement("div");
      loadingDiv.innerHTML = "Loading forecast data...";
      wrapper.appendChild(loadingDiv);
    }

    return wrapper;
  },

  getWeatherData: function (_this) {
    _this.sendSocketNotification("GET-2DAY-NOAA-FORECAST", _this.url);
    setTimeout(_this.getWeatherData, _this.config.interval, _this);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GOT-2DAY-NOAA-FORECAST" && payload.url === this.url) {
      this.loaded = true;
      this.forecast = payload.forecast;
      this.updateDom(1000);
    }
  },

  convertTemp: function (temp) {
    let celsius = Math.round(((temp - 32) * 5) / 9);
    let fahrenheit = Math.round(temp);
    return this.units === "metric"
      ? `${celsius} °C / ${fahrenheit} °F`
      : `${fahrenheit} °F / ${celsius} °C`;
  },
});
