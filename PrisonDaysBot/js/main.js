// js/main.js
$(document).ready(function() {
  $('#start-button').click(function() {
    startGame();
  });

  function startGame() {
    $('#start-screen').hide();
    $('#gamefield').show();
    initializeGame(); // Запускаем игру
  }
});
