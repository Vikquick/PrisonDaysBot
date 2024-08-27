// js/game.js
function initializeGame() {
  const gemSize = 64; // размер гема
  const gemClass = "gem"; // класс элементов-гемов
  const gemIdPrefix = "gem"; // префикс для идентификаторов
  const numRows = 6; // количество рядов
  const numCols = 7; // количество колонок
  const jewels = Array(numRows).fill().map(() => Array(numCols).fill(-1)); // двумерный массив гемов на поле
  let gameState = "pick"; // текущее состояние поля - ожидание выбора гема
  let selectedRow = -1; // выбранный ряд
  let selectedCol = -1; // выбранный столбец
  let posX; // столбец второго выбранного гема
  let posY; // ряд второго выбранного гема
  let swipeStart = null; // начальный гем для свайпа
  let movingItems = 0; // количество передвигаемых в данный момент гемов

  const bgColors = [
    "magenta", 
    "mediumblue", 
    "yellow", 
    "lime", 
    "cyan", 
    "orange", 
    "crimson", 
    "gray"
  ];

  $("#gamefield").css({
    "background-color": "#000000",
    "width": (numCols * gemSize) + "px",
    "height": (numRows * gemSize) + "px"
  });

  function generateInitialGems() {
    console.log("Generating initial gems...");
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        do {
          jewels[i][j] = Math.floor(Math.random() * bgColors.length);
        } while (isStreak(i, j));
        $("#gamefield").append('<div class="' + gemClass + '" id="' + gemIdPrefix + '_' + i + '_' + j + '"></div>');
        $("#" + gemIdPrefix + "_" + i + "_" + j).css({
          "top": (i * gemSize) + "px",
          "left": (j * gemSize) + "px",
          "width": "54px",
          "height": "54px",
          "background-color": bgColors[jewels[i][j]]
        });
      }
    }
  }

  function isVerticalStreak(row, col) {
    const gemValue = jewels[row][col];
    let streak = 0;
    let tmp = row;
    while (tmp > 0 && jewels[tmp - 1][col] === gemValue) {
      streak++;
      tmp--;
    }
    tmp = row;
    while (tmp < numRows - 1 && jewels[tmp + 1][col] === gemValue) {
      streak++;
      tmp++;
    }
    return streak > 1;
  }

  function isHorizontalStreak(row, col) {
    const gemValue = jewels[row][col];
    let streak = 0;
    let tmp = col;
    while (tmp > 0 && jewels[row][tmp - 1] === gemValue) {
      streak++;
      tmp--;
    }
    tmp = col;
    while (tmp < numCols - 1 && jewels[row][tmp + 1] === gemValue) {
      streak++;
      tmp++;
    }
    return streak > 1;
  }

  function isStreak(row, col) {
    return isVerticalStreak(row, col) || isHorizontalStreak(row, col);
  }

  $("#gamefield").swipe({
    tap: tapHandler,
    swipe: swipeHandler,
    swipeStatus: swipeStatusHandler
  });

  function swipeStatusHandler(event, phase) {
    if (phase === "start") {
      swipeStart = $(event.target).hasClass("gem") ? event.target : null;
    }
  }

  function swipeHandler(event, direction) {
    if (swipeStart != null && gameState === "pick") {
      const startRow = parseInt($(swipeStart).attr("id").split("_")[1]);
      const startCol = parseInt($(swipeStart).attr("id").split("_")[2]);
      const directions = {
        "up": [startRow - 1, startCol],
        "down": [startRow + 1, startCol],
        "left": [startRow, startCol - 1],
        "right": [startRow, startCol + 1]
      };
      const [endRow, endCol] = directions[direction] || [];
      if (endRow >= 0 && endRow < numRows && endCol >= 0 && endCol < numCols) {
        $("#marker").hide();
        gameState = "switch";
        posX = endCol;
        posY = endRow;
        gemSwitch();
      }
    }
  }

  function tapHandler(event, target) {
    if ($(target).hasClass("gem")) {
      const row = parseInt($(target).attr("id").split("_")[1]);
      const col = parseInt($(target).attr("id").split("_")[2]);
      if (gameState === "pick") {
        if (selectedRow === -1) {
          selectedRow = row;
          selectedCol = col;
          $("#marker").show().css("top", row * gemSize).css("left", col * gemSize);
        } else {
          if ((Math.abs(selectedRow - row) === 1 && selectedCol === col) ||
              (Math.abs(selectedCol - col) === 1 && selectedRow === row)) {
            $("#marker").hide();
            gameState = "switch";
            posX = col;
            posY = row;
            gemSwitch();
          } else {
            selectedRow = row;
            selectedCol = col;
            $("#marker").show().css("top", row * gemSize).css("left", col * gemSize);
          }
        }
      }
    }
  }

  function gemSwitch() {
    const yOffset = selectedRow - posY;
    const xOffset = selectedCol - posX;

    $("#" + gemIdPrefix + "_" + selectedRow + "_" + selectedCol)
      .addClass("switch")
      .attr("dir", "-1");
    $("#" + gemIdPrefix + "_" + posY + "_" + posX)
      .addClass("switch")
      .attr("dir", "1");

    $.each($(".switch"), function() {
      movingItems++;
      $(this).animate({
        left: "+=" + xOffset * gemSize * $(this).attr("dir"),
        top: "+=" + yOffset * gemSize * $(this).attr("dir")
      }, {
        duration: 250,
        complete: function() {
          checkMoving();
        }
      }).removeClass("switch");
    });

    const temp = jewels[selectedRow][selectedCol];
    jewels[selectedRow][selectedCol] = jewels[posY][posX];
    jewels[posY][posX] = temp;

    $("#" + gemIdPrefix + "_" + selectedRow + "_" + selectedCol).attr("id", "temp");
    $("#" + gemIdPrefix + "_" + posY + "_" + posX).attr("id", gemIdPrefix + "_" + selectedRow + "_" + selectedCol);
    $("#temp").attr("id", gemIdPrefix + "_" + posY + "_" + posX);
  }

  function checkMoving() {
    movingItems--;
    // когда закончилась анимация последнего гема
    if (movingItems === 0) {
      // действуем в зависимости от состояния игры
      switch (gameState) {
        case "switch":
        case "revert":
          // проверяем, появились ли группы сбора
          if (!isStreak(selectedRow, selectedCol) && !isStreak(posY, posX)) {
            // если групп сбора нет, нужно отменить совершенное движение
            if (gameState !== "revert") {
              gameState = "revert";
              gemSwitch();
            } else {
              gameState = "pick";
              selectedRow = -1;
            }
          } else {
            // если группы сбора есть, нужно их удалить
            gameState = "remove";
            if (isStreak(selectedRow, selectedCol)) {
              removeGems(selectedRow, selectedCol);
            }
            if (isStreak(posY, posX)) {
              removeGems(posY, posX);
            }
            gemFade();
          }
          break;

        case "remove":
          checkFalling();
          break;

        case "refill":
          placeNewGems();
          break;
      }
    }
  }

  function placeNewGems(){
    let gemsPlaced = 0;
    for(let i = 0; i < numCols; i++) {
      if(jewels[0][i] == -1) {
        jewels[0][i] = Math.floor(Math.random() * 8);
        $("#gamefield")
          .append('<div class="' + gemClass + '" id="' + gemIdPrefix + '_0_' + i + '"></div>');
        $("#" + gemIdPrefix + "_0_" + i).css({
          "top": "4px",
          "left": (i * gemSize) + 4 + "px",
          "width": "54px",
          "height": "54px",
          "position": "absolute",
          "border": "1px solid white",
          "cursor": "pointer",
          "background-color": bgColors[jewels[0][i]]
        });
        gemsPlaced++;
      }
    }

    /* если появились новые гемы, проверить, нужно ли опустить что-то вниз */
    if(gemsPlaced) {
      gameState = "remove";
      checkFalling();
    } else {
      /* если новых гемов не появилось, проверяем поле на группы сбора */
      let combo = 0;
      for(let i = 0; i < numRows; i++) {
        for(let j = 0; j < numCols; j++) {
          if(j <= numCols - 3 && jewels[i][j] == jewels[i][j + 1] && jewels[i][j] == jewels[i][j + 2]){
            combo++;
            removeGems(i, j);
          }
          if(i <= numRows - 3 && jewels[i][j] == jewels[i + 1][j] && jewels[i][j] == jewels[i + 2][j]){
            combo++;
            removeGems(i, j);
          }
        }
      }
      // удаляем найденные группы сбора
      if(combo > 0){
        gameState = "remove";
        gemFade();
      } else { // или вновь запускаем цикл игры
        gameState = "pick";
        selectedRow = -1;
      }
    }
  }

  function removeGems(row, col) {
    let gemValue = jewels[row][col];
    let tmp = row;
    $("#" + gemIdPrefix + "_" + row + "_" + col).addClass("remove");
    if(isVerticalStreak(row, col)){
      while(tmp > 0 && jewels[tmp - 1][col] == gemValue){
        $("#" + gemIdPrefix + "_" + (tmp - 1) + "_" + col).addClass("remove");
        jewels[tmp - 1][col] = -1;
        tmp--;
      }
      tmp = row;
      while(tmp < numRows - 1 && jewels[tmp + 1][col] == gemValue){
        $("#" + gemIdPrefix + "_" + (tmp + 1) + "_" + col).addClass("remove");
        jewels[tmp + 1][col] = -1;
        tmp++;
      }
    }
    if(isHorizontalStreak(row, col)){
      tmp = col;
      while(tmp > 0 && jewels[row][tmp - 1] == gemValue){
        $("#" + gemIdPrefix + "_" + row + "_" + (tmp - 1)).addClass("remove");
        jewels[row][tmp - 1] = -1;
        tmp--;
      }
      tmp = col;
      while(tmp < numCols - 1 && jewels[row][tmp + 1] == gemValue){
        $("#" + gemIdPrefix + "_" + row + "_" + (tmp + 1)).addClass("remove");
        jewels[row][tmp + 1] = -1;
        tmp++;
      }
    }
    jewels[row][col] = -1;
  }

  /* удаляем гемы с поля */
  function gemFade(){
    $.each($(".remove"), function(){
      movingItems++;
      $(this).animate({
        opacity: 0
      }, {
        duration: 200,
        complete: function() {
          $(this).remove();
          // снова проверяем состояние поля
          checkMoving();
        }
      });
    });
  }

  function checkFalling() {
    let fellDown = 0;

    for(let j = 0; j < numCols; j++) {
      for(let i = numRows - 1; i > 0; i--) {
        if(jewels[i][j] == -1 && jewels[i - 1][j] >= 0) {
          $("#" + gemIdPrefix + "_" + (i - 1) + "_" + j)
            .addClass("fall")
            .attr("id", gemIdPrefix + "_" + i + "_" + j);
          jewels[i][j] = jewels[i - 1][j];
          jewels[i - 1][j] = -1;
          fellDown++;
        }
      }
    }
    $.each($(".fall"), function() {
      movingItems++;
      $(this).animate({
        top: "+=" + gemSize
      }, {
        duration: 100,
        complete: function() {
          $(this).removeClass("fall");
          checkMoving();
        }
      });
    });

    // если падать больше нечему, изменяем состояние игры
    if(fellDown === 0){
      gameState = "refill";
      movingItems = 1;
      checkMoving();
    }
  }

  generateInitialGems();
}
