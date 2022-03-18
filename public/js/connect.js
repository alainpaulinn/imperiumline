$('#login-tab').click(function() {
    $(this).addClass("active");
    $(this).next().removeClass("active");
    $('.register').removeClass("content-active");
    $('.login').addClass("content-active");
  })
  
  $('#register-tab').click(function() {
    $(this).addClass("active");
    $(this).prev().removeClass("active");
    $('.register').addClass("content-active");
    $('.login').removeClass("content-active");
  })
  function showPwLogin() {
    var x = document.getElementById("password_login");
    if (x.type === "password") {
      x.type = "text";
    } else {
      x.type = "password";
    }
  }
  function showPwRegister() {
    var x = document.getElementById("password_register1");
    var y = document.getElementById("password_register2");
    if (x.type === "password") {
      x.type = "text";
      y.type = "text";
    } else {
      x.type = "password";
      y.type = "password";
    }
  }

  var socket = io();
var form = document.getElementById('form');
var input = document.getElementById('input');

