fetch("https://restore.jigglything.com/api/resources", {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer ' + document.cookie.split("token=")[1].split(";")[0]
    },
}).then(res => {
    res.json().then((body) => {
        if (body['error']) {
            showErrorOverlay("Server error");
        } else {
            console.log(body);

            //RAM Stats:
            usedMemGb = body['memData']['usedMemMb'] / 1024;
            totalMemGb = body['memData']['totalMemMb'] / 1024;
            $("#ram-usage-tile .stat-card-value").text(usedMemGb.toFixed(2) + "GB of " + totalMemGb.toFixed(2) + "GB")

            usedMemPercentage = 100 - body['memData']['freeMemPercentage'];
            $("#ram-usage-tile .stat-card-subvalue").text(usedMemPercentage.toFixed(2) + "% Currently Used")

            //CPU Stats:
            $("#cpu-usage-tile .stat-card-value").text(body['cpuData']['cpuPercent'] + "% Currently Used")
            //$("#cpu-usage-tile .stat-card-subvalue").text(body['cpuData']['model'])
        }
    })
});