const ratpApiURL  = 'https://api-ratp.pierre-grimaud.fr/v4';
const horaireBuresR = '/schedules/rers/B/bures+sur+yvette/R';
const horaireBuresA = '/schedules/rers/B/bures+sur+yvette/A';
const infoTrafic = '/traffic';
const weatherUrl = 'http://api.openweathermap.org/data/2.5/weather?appid=3db579345c76baae501dc103997c3e5a&&units=metric&id=';
// const weatherUrl = 'http://api.openweathermap.org/data/2.5/weather?q=Bures&appid=3db579345c76baae501dc103997c3e5a&&units=metric';

const scheduleCount = 3;

const cityData = [{"id" : "3029522" , "name" : "Bures sur Yvette"}, 
                    { "id" : "2988507", "name" : "Paris"},
                    { "id" : "1581130", "name" : "Hanoi"}, 
                    { "id" : "1568574", "name" : "Quy Nhon"}, 
                    { "id" : "1566083", "name" : "Ho Chi Minh"},
                ];


function BindCitiesToSelector()
{
    cityData.forEach(element => {
        $("#ddlCity").append('<option value="' + element.id + '">' + element.name + '</option>');
    });
}


function InitWeather() {
    var cityId = $( "#ddlCity" ).val();
    if(cityId == undefined || cityId == null)
        return;

    var result = GetJSONFromApi(weatherUrl + cityId);
    if(result != undefined && result != null)
    {
        $('#weatherInfo').removeClass("invisible");
        $('#weatherInfo').addClass("visible");

        var weatherData = result.weather;
        var weatherMainData = result.main;

        var weatherPanel = $('#weatherPanel');
        weatherPanel.find("div.loading-msg").hide();
        
        weatherPanel.find("div.weather-current").text(weatherData[0].main);
        weatherPanel.find("div.weather-description").text(weatherData[0].description);
        weatherPanel.find("img.weather-icon").attr("src", 'weatherIcons/' + weatherData[0].icon + '@2x.png');
    
        weatherPanel.find("div.weather-temp").text(weatherMainData.temp);
        weatherPanel.find("div.weather-temp-feel-like").text(weatherMainData.feels_like);
        weatherPanel.find("div.weather-temp-min-max").text(weatherMainData.temp_min + '/' + weatherMainData.temp_max);
        weatherPanel.find("div.weather-pressure").text(weatherMainData.pressure);
        weatherPanel.find("div.weather-humidity").text(weatherMainData.humidity);
    }
}


function ScheduleBuresAller(){
    
    var response = GetJSONFromApi(ratpApiURL + horaireBuresA);

    if(response == undefined || response == null || response.result == undefined || response.result == null)
        return;

    var result = response.result;

    if(result != undefined && result != null && result.schedules.length > 0)
    {
        var info = $('#schedule-info-A');
        var cardInfo = $('#card-info-Bures-A');

        var schedules = result.schedules;

        if(schedules.length > 0)
        {
            cardInfo.find("div.loading-msg").hide();
            let prefix = '<ul class="list-group">';
            let surfix = '</ul>';
            let str = '';
            let i = 0;
            schedules.forEach(element => {
                if(i < scheduleCount)
                    str += '<li class="list-group-item">'
                            + '<div class="code">' + element.code +'</div>'
                            + '<div class="message">' + element.message +'</div>'
                            + '<div class="destination">' + element.destination +'</div>'
                        + '</li>';
                i++
            });

            info.html(prefix + str + surfix);
        }
    }   
}

function ScheduleBuresRetour(){
    
    var response = GetJSONFromApi(ratpApiURL + horaireBuresR);

    if(response == undefined || response == null || response.result == undefined || response.result == null)
        return;

    var result = response.result;

    if(result != undefined && result != null && result.schedules.length > 0)
    {
        var info = $('#schedule-info-R');
        var cardInfo = $('#card-info-Bures-R');

        var schedules = result.schedules;
        
        if(schedules.length > 0)
        {
            cardInfo.find("div.loading-msg").hide();
            let prefix = '<ul class="list-group">';
            let surfix = '</ul>';
            let str = '';
            let i = 0;
            schedules.forEach(element => {
                if( i < scheduleCount)
                str += '<li class="list-group-item">'
                            + '<div class="code">' + element.code +'</div>'
                            + '<div class="message">' + element.message +'</div>'
                            + '<div class="destination">' + element.destination +'</div>'
                        + '</li>';
                i++;
            });

            info.html(prefix + str + surfix);
        }
    }   
}

function InitInfoRerB(){
    var response = GetJSONFromApi(ratpApiURL + infoTrafic);

    if(response == undefined || response == null || response.result == undefined || response.result == null)
        return;

    var result = response.result;

    if(result != undefined && result != null && result.rers.length > 0)
    {
        var cardRer = $('#card-rer-B');        

        var rers = result.rers;

        var rer = rers.find(station => station.line === 'B');

        if(rer != undefined)
        {
            //loading-msg
            cardRer.find("div.loading-msg").hide();
            cardRer.find("div.msg-title").text(rer.title);
            cardRer.find("div.msg-content").text(rer.message);
        }
    }    
}

function InitInfoRerA(){
    var response = GetJSONFromApi(ratpApiURL + infoTrafic);

    if(response == undefined || response == null || response.result == undefined || response.result == null)
        return;

    var result = response.result;

    if(result != undefined && result != null && result.rers.length > 0)
    {
        var cardRer = $('#card-rer-A');        

        var rers = result.rers;

        var rer = rers.find(station => station.line === 'A');

        if(rer != undefined)
        {
            //loading-msg
            cardRer.find("div.loading-msg").hide();
            cardRer.find("div.msg-title").text(rer.title);
            cardRer.find("div.msg-content").text(rer.message);
        }
    }    
}

function GetJSONFromApi(url) {    
    var result = null;

    $.ajax({
        type: "GET",               
        url: url,               
        dataType: "json",
        async: false,
        error: function (response) {
                    console.log('Error: There was a problem processing your request, please refresh the browser and try again');
            },
        success: function (response) {
           
            result = response;
        }
    });

    return result;
}