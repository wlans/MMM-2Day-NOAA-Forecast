const url = require("url");
const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
  start: function () {
    Log.log(`Starting node helper for: ${this.name}`);
  },

  getWeatherData: function (payload) {
    let _this = this;

    fetch(payload)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const forecastUrl = data.properties.forecast;
        _this.getForecastData(payload, forecastUrl);
      })
      .catch(function (error) {
        Log.error("Error fetching weather data:", error);
      });
  },

  getForecastData: function (url1, url2) {
    let _this = this;

    fetch(url2)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const periods = data.properties.periods;

        if (periods && periods.length > 0) {
          const forecast = _this.parseData(periods);
          Log.info("Got full forecast data from api.weather.gov");

          _this.sendSocketNotification("GOT-2DAY-NOAA-FORECAST", {
            url: url1,
            forecast: forecast,
          });
        } else {
          Log.error("Forecast data is empty or invalid");
          _this.sendSocketNotification("GOT-2DAY-NOAA-FORECAST", {
            url: url1,
            forecast: _this.fillEmptyData(),
          });
        }
      })
      .catch(function (error) {
        Log.error("Error fetching forecast data:", error);
        _this.sendSocketNotification("GOT-2DAY-NOAA-FORECAST", {
          url: url1,
          forecast: _this.fillEmptyData(),
        });
      });
  },

  parseData: function (data) {
    let forecast = [];

    data.forEach((element) => {
      forecast.push({
        name: element.name,
        date: element.startTime,
        isDay: element.isDaytime,
        icon: this.parseIcon(element.icon),
        conditions: element.shortForecast,
        temp: element.temperature,
        pop: element.probabilityOfPrecipitation?.value || 0,
        wspd: element.windSpeed
          .replace("to ", "")
          .split(" ")
          .slice(0, -1)
          .map(Number),
        wdir: element.windDirection,
      });
    });

    return forecast;
  },

  parseIcon: function (icon_url) {
    let data = url.parse(icon_url).pathname.split("/").slice(4);

    if (data.length === 1) {
      let d0 = data[0].split(",");
      return d0.length === 2 ? d0[0] : data[0];
    } else {
      let d0 = data[0].split(",");
      let d1 = data[1].split(",");
      if (d0.length === 2) {
        return parseInt(d0[1], 10) > 50 ? d0[0] : d1[0];
      } else if (d1.length === 2) {
        return parseInt(d1[1], 10) > 50 ? d1[0] : d0[0];
      } else {
        return d0[0];
      }
    }
  },

  fillEmptyData: function () {
    return [
      {
        name: "No Data",
        date: "N/A",
        isDay: false,
        icon: "not_available",
        conditions: "No forecast available",
        temp: "--",
        pop: "--",
        wspd: ["--"],
        wdir: "--",
      },
    ];
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET-2DAY-NOAA-FORECAST") {
      this.getWeatherData(payload);
    }
  },
});
