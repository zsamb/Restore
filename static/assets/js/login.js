
$(document).ready(function() {
  $("#login-form #login-submit").click(function(e) {
    e.preventDefault()
    fetch("/api/user/login", {
      method: "POST",
      body: JSON.stringify({
        username: $('#login-form input[name$="username"]').val(),
        password: $('#login-form input[name$="password"]').val()
      }),
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
    }).then(res => {
      res.json()
      .then((body) => {
        if (body['error']) {
          if (body[data].includes("No matching document found for id")) {
            console.log("Server Error")
          }
          switch (body['data']) {
            case 'Failed to login: Could not find user.':
              console.log("Invalid Username")
              break;
            case 'Failed to login: Invalid password.':
              console.log("Invalid Password")
              break;
          }
        } else {
          fetch("/api/httpEnabled")
          .then(res => {
            res.json()
            .then(resJSON => {
              if (!document.cookie.match(/^(.*;)?\s*token\s*=\s*[^;]+(.*)?$/)) {
                document.cookie = `token=${body['token']}; path=/; ${resJSON.http ? "" : "secure"}`;
                window.location = '/dash/home';
              }
            })
          }).catch(error => console.log(error))
        }
      })
    }).catch(err => console.log(err))

  })
});
