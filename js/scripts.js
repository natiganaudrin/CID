/*!
* Start Bootstrap - One Page Wonder v6.0.6 (https://startbootstrap.com/theme/one-page-wonder)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-one-page-wonder/blob/master/LICENSE)
*/
// This file is intentionally blank
// Use this file to add JavaScript to your project

const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const rows = 20; // nombre de cellules par ligne
    const cols = 20; // nombre par colonne
    const cellSize = Math.floor(canvas.width / cols);

    // État du jeu
    let snake, apple, dir, nextDir, score, running, gameLoopId, speed, best;

    // UI elements
    const scoreEl = document.getElementById('score');
    const bestEl = document.getElementById('best');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
	

    // Charger meilleur score
    try { best = parseInt(localStorage.getItem('snake_best') || '0', 10); } catch(e){ best = 0; }
    bestEl.textContent = best;

    // Initialisation
    function init(){
      snake = [ {x: Math.floor(cols/2), y: Math.floor(rows/2)} ];
      // initial length 4 to start
      for(let i=1;i<4;i++) snake.push({x: snake[0].x - i, y: snake[0].y});
      dir = {x:1,y:0};
      nextDir = {x:1,y:0};
      placeApple();
      score = 0;
      speed = 8; // frames per second
      running = false;
      updateUI();
      draw();
    }

    function placeApple(){
      while(true){
        const x = Math.floor(Math.random()*cols);
        const y = Math.floor(Math.random()*rows);
        if(!snake.some(s => s.x === x && s.y === y)){
          apple = {x,y};
          return;
        }
      }
    }

    function updateUI(){
      scoreEl.textContent = score;
      bestEl.textContent = best;
    }

    function drawCell(x,y,fill){
      ctx.fillStyle = fill;
      ctx.fillRect(x*cellSize+1, y*cellSize+1, cellSize-2, cellSize-2);
    }

    function draw(){
      // clear
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // grid subtle
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 1;
      for(let i=0;i<=cols;i++){
        ctx.beginPath();ctx.moveTo(i*cellSize,0);ctx.lineTo(i*cellSize,canvas.height);ctx.stroke();
      }
      for(let j=0;j<=rows;j++){
        ctx.beginPath();ctx.moveTo(0,j*cellSize);ctx.lineTo(canvas.width,j*cellSize);ctx.stroke();
      }

      // apple
      drawCell(apple.x, apple.y, '#ef4444');

      // snake
      for(let i=0;i<snake.length;i++){
        const seg = snake[i];
        const hue = 140 - Math.floor((i/snake.length)*60);
        drawCell(seg.x, seg.y, `hsl(${hue} 70% 45%)`);
      }

      // if not running, overlay message
      if(!running){
        ctx.fillStyle = 'rgba(2,6,23,0.6)';
        ctx.fillRect(0, canvas.height/2 - 36, canvas.width, 72);
        ctx.fillStyle = '#e6eef6';
        ctx.textAlign = 'center';
        ctx.font = '18px system-ui, Arial';
        ctx.fillText('Appuyez sur Démarrer pour jouer', canvas.width/2, canvas.height/2 + 6);
      }
    }

    function step(){
      // apply direction
      dir = nextDir;
      const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};

      // collisions murs
      if(head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows){
        return gameOver();
      }

      // collision corps
      if(snake.some(s => s.x === head.x && s.y === head.y)){
        return gameOver();
      }

      snake.unshift(head);

      // manger pomme ?
      if(head.x === apple.x && head.y === apple.y){
        score++;
        // speed up a bit
        if(score % 5 === 0) speed = Math.min(20, speed + 1);
        placeApple();
      } else {
        snake.pop();
      }

      updateUI();
      draw();
    }

    function gameOver(){
      running = false;
      cancelAnimationFrame(gameLoopId);
      // sauvegarder meilleur score
      if(score > best){
        best = score;
        try{ localStorage.setItem('snake_best', String(best)); } catch(e){}
      }
      updateUI();
      // simple flash
      ctx.fillStyle = 'rgba(239,68,68,0.06)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      setTimeout(draw, 150);
    }

    // main loop using rAF with timestep
    let lastTime = 0;
    function loop(ts){
      if(!running) return;
      if(!lastTime) lastTime = ts;
      const elapsed = ts - lastTime;
      const frameDuration = 1000 / speed;
      if(elapsed >= frameDuration){
        lastTime = ts;
        step();
      }
      gameLoopId = requestAnimationFrame(loop);
    }

    // Controls
    function setDirection(dx,dy){
      // prevent reversing
      if(dx === -dir.x && dy === -dir.y) return;
      nextDir = {x:dx,y:dy};
    }

    window.addEventListener('keydown', e => {
      if(e.key === 'ArrowUp' || e.key === 'z' || e.key === 'Z') setDirection(0,-1);
      if(e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') setDirection(0,1);
      if(e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'Q') setDirection(-1,0);
      if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setDirection(1,0);
      if(e.key === ' '){ // space to pause
        togglePause();
      }
    });

    // mobile buttons
    document.querySelectorAll('[data-dir]').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = btn.dataset.dir;
        if(d === 'up') setDirection(0,-1);
        if(d === 'down') setDirection(0,1);
        if(d === 'left') setDirection(-1,0);
        if(d === 'right') setDirection(1,0);
        // give immediate step for more responsive feel
        if(!running){ draw(); }
      });
    });

    // swipe support
    let touchStart = null;
    canvas.addEventListener('touchstart', e => {
      const t = e.touches[0];
      touchStart = {x:t.clientX, y:t.clientY};
    }, {passive:true});
    canvas.addEventListener('touchend', e => {
      if(!touchStart) return;
      const t = (e.changedTouches && e.changedTouches[0]) || null;
      if(!t) return;
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      if(Math.abs(dx) > Math.abs(dy)){
        if(dx > 20) setDirection(1,0);
        else if(dx < -20) setDirection(-1,0);
      } else {
        if(dy > 20) setDirection(0,1);
        else if(dy < -20) setDirection(0,-1);
      }
      touchStart = null;
    }, {passive:true});

    // Buttons
    startBtn.addEventListener('click', () => {
      if(!running){
        running = true; lastTime = 0; gameLoopId = requestAnimationFrame(loop);
      }
    });
    pauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', () => { init(); });

    function togglePause(){
      running = !running;
      if(running){ lastTime = 0; gameLoopId = requestAnimationFrame(loop); }
      else cancelAnimationFrame(gameLoopId);
      pauseBtn.textContent = running ? 'Pause' : 'Reprendre';
    }

    // click canvas to focus for keyboard control
    canvas.addEventListener('click', () => canvas.focus());
    canvas.setAttribute('tabindex', '0');

    // Init
    init();

    // Responsive: recompute cell size on resize to keep square cells
    window.addEventListener('resize', () => {
      const min = Math.min(window.innerWidth - 80, 640);
      const size = Math.max(320, Math.min(640, min));
      canvas.width = size; canvas.height = size;
      // recalc cell size
      // (we used cellSize constant earlier, but recompute for new canvas)
      // For simplicity we reload the page state
      draw();
    });