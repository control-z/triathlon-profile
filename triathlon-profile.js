// add anchor to all links to keep context
var fixlinks = function() {
  $('#home').attr('href', './'+window.location.hash);
  $('#about').attr('href', './about.html'+window.location.hash);
};

var load_about = function() {
  $(function() {
    fixlinks();
  });
};

var load_home = function() {
  $(function() {
    var performance = [];
    var sliders = [12];
    var timeout = -1;

    // function to populate radar chart & sliders
    var populate = function(item) {
      if(performance.length > 0 && performance[item].data) {
        $('#tridate').text(performance[item].date);
        var dataset = performance[item].data;
        for(var i = 0; i < dataset.length; i++) {
          chart.data.datasets[0].data[i] = dataset[i];
          sliders[i].slider('setValue',dataset[i]);
          sliders[i].slider('relayout');
        }
        chart.update();
      }
    };

    // function to show dataset
    var wayback = function(item) {
      $('#bar').css('width',~~(((item+1) / performance.length) * 100) + '%');
      populate(item);
      if(item < (performance.length-1)) {
        timeout = setTimeout(function() { wayback(item+1) }, 1000)
      } else {
        timeout = setTimeout(function() {
          $('#play').show();
          $('#stop').hide();
          $('#save').prop('disabled', false);
        }, 1000);
      }
    };

    // function to set a particular chart value
    var chartval = function(indexToUpdate, val) {
      chart.data.datasets[0].data[indexToUpdate] = val;
      chart.update();
    };

    // draw empty chart
    var chart = new Chart(document.getElementById("myChart"), {
      type: 'radar',
      options: {
        pointDot : true,
        responsive: true,
        legend: {
          display: false
        },
        aspectRatio: 1,
        scale: {
          pointLabels: {
            fontFamily: "'Ubuntu',Tahoma,'Helvetica Neue',Helvetica,Arial,sans-serif",
            fontSize: 14
          },
          ticks: {
              max: 10,
              min: 0,
              stepSize: 2
          }
        }
      },
      data: {
        labels: ["Technology", "Swim", "Bike", "Run", "Transition", "S&C", "Injuries", "Psychology", "Lifestyle", "Commitment", "Nutrition", "Physiology"],
        datasets: [{
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          backgroundColor: "rgba(255,50,50,0.2)",
          borderColor: "rgba(179,181,198,1)",
          pointBackgroundColor: "rgba(179,181,198,1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(179,181,198,1)"
        }]
      }
    });

    // draw empty sliders
    for(let i = 0; i < 12; i++) {
      sliders[i] = $("#slider"+(i+1)).slider({
        max:10,
        value:0,
        formatter: function(v) {
          return chart.data.labels[i] + ': ' + v;
        }
      });
      sliders[i].on('change', function(event) { chartval(i, event.value.newValue); });
    }

    // if url has hash component, use it to load data
    var hash = window.location.hash ? window.location.hash.replace('#','/') : '';
    var action = 'POST';
    $('#tridate').text(moment().format('MMMM Do YYYY'));
    if(hash) {
      $('#load').show();
      $.ajax({
        url:"https://api.myjson.com/bins"+hash,
        type:"GET",
      }).done(function(data, textStatus, jqXHR) {
        action = 'PUT';
        performance = data;
        fixlinks();
        if(performance.length > 0) {
          populate(performance.length-1);
        }
        $('#load').hide();
        if(performance.length > 1) {
          $('#play').show();
        }
      }).fail(function(jqXHR, textStatus, error) {
        hash = '';
        $('#load').hide();
        $('#message').removeClass('text-success');
        $('#message').addClass('text-danger');
        $('#message').html('Failed to load saved data.');
        $('#spinner').hide();
        $('#message').show();
      });
    }

    // function to play history
    $('#play').on('click',function(event) {
      $('#play').hide();
      $('#stop').show();
      $('#save').prop('disabled', true);
      wayback(0);
    });

    // function to stop history
    $('#stop').on('click',function(event) {
      if(timeout > 0) {
        clearTimeout(timeout);
        timeout = -1;
      }
      populate(performance.length-1);
      $('#bar').css('width','0%');
      $('#stop').hide();
      $('#play').show();
      $('#save').prop('disabled', false);
    });

    // function to save current data
    $('#save').on('click',function(event) {
      performance.push({
        date: moment().format('MMMM Do YYYY'),
        data: chart.data.datasets[0].data.slice()
      });
      $('#save').prop('disabled', true);
      $('#message').hide();
      $('#spinner').show().delay(2000);
      $.ajax({
        url:         "https://api.myjson.com/bins"+hash,
        type:        action,
        data:         JSON.stringify(performance),
        contentType: "application/json; charset=utf-8",
        dataType:    "json"
      }).done(function(data, textStatus, jqXHR) {
        if(data.uri) {
          var key = data.uri.match(/\/bins\/(.*)/)[1];
          window.location.hash = key;
          hash = '/'+key;
          action = 'PUT';
          $('#message').html('Saved. Bookmark this: <a target="_blank" href="' + window.location.href + '">' + window.location.href + '</a>');
        } else {
          $('#message').html('Saved. <a target="_blank" href="' + window.location.href + '">' + window.location.href + '</a>' );
        }
        fixlinks();
        $('#message').removeClass('text-danger');
        $('#message').addClass('text-success');
        if(performance.length > 0) {
          populate(performance.length-1);
        }
        if(performance.length > 1) {
          $('#play').show();
        }
        $('#spinner').hide();
        $('#message').fadeIn();
      }).fail(function(jqXHR, textStatus, error) {
        performance.pop();
        $('#message').removeClass('text-success');
        $('#message').addClass('text-danger');
        $('#message').html('Error. Failed to save data. Please try again.');
        $('#spinner').hide();
        $('#message').show();
      });
      $('#save').prop('disabled', false);
    });
  });
};
