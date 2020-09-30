function showLoadingOverlay(message='') {
  if (document.getElementById('popup-overlay').classList.contains('visible-popup-overlay') == false) {
    $(".popup-overlay").toggleClass("visible-popup-overlay")
  }
  $("#loading-popup").toggleClass("visible-loading-popup")
  $("#loading-popup").append($("<p id='loading-popup-message'></p>").text(message));
}

function cancelLoadingOverlay() {
  if (document.getElementById('popup-overlay').classList.contains('visible-popup-overlay') == true) {
    $(".popup-overlay").toggleClass("visible-popup-overlay")
  }
  if (document.getElementById('loading-popup').classList.contains('visible-loading-popup') == true) {
    $("#loading-popup").toggleClass("visible-loading-popup")
    $("#loading-popup p").remove();
  }
}
