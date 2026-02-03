<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-md transition-all duration-500">
    <div class="loader">
      <div class="box box-1">
        <div class="side-left"></div>
        <div class="side-right"></div>
        <div class="side-top"></div>
      </div>
      <div class="box box-2">
        <div class="side-left"></div>
        <div class="side-right"></div>
        <div class="side-top"></div>
      </div>
      <div class="box box-3">
        <div class="side-left"></div>
        <div class="side-right"></div>
        <div class="side-top"></div>
      </div>
      <div class="box box-4">
        <div class="side-left"></div>
        <div class="side-right"></div>
        <div class="side-top"></div>
      </div>
    </div>
    
    <div class="absolute mt-32 text-slate-500 font-medium tracking-widest text-sm uppercase animate-pulse">
      Filtering
    </div>
  </div>
</template>

<style scoped>
.loader {
  scale: 2;
  height: 48px;
  width: 48px;
  transform: rotateX(45deg) rotateZ(45deg);
  perspective: 1000px;
}

.box {
  position: absolute;
  top: 0;
  left: 0;
  width: 24px;
  height: 24px;
  background: transparent;
  transform: translateZ(12px);
}

.box-1 {
  transform: translateZ(12px);
  animation: box1 2s linear infinite;
}
.box-2 {
  transform: rotateZ(90deg) translateZ(12px);
  animation: box2 2s linear infinite;
}
.box-3 {
  transform: rotateZ(180deg) translateZ(12px);
  animation: box3 2s linear infinite;
}
.box-4 {
  transform: rotateZ(270deg) translateZ(12px);
  animation: box4 2s linear infinite;
}

.side-left {
  position: absolute;
  background-color: #3b82f6; /* Blue-500 */
  width: 24px;
  height: 12px;
  transform: rotateY(90deg) translateX(-12px) translateY(-6px);
}
.side-right {
  position: absolute;
  background-color: #1e40af; /* Blue-800 */
  width: 24px;
  height: 12px;
  transform: rotateY(90deg) translateX(-12px) translateY(6px);
}
.side-top {
  position: absolute;
  background-color: #60a5fa; /* Blue-400 */
  width: 24px;
  height: 24px;
  transform: translateZ(12px);
}

@keyframes box1 {
  0%, 50% { transform: translate(0, 0) translateZ(12px); }
  62.5% { transform: translate(0, 24px) translateZ(12px); }
  75% { transform: translate(24px, 24px) translateZ(12px); }
  87.5% { transform: translate(24px, 0) translateZ(12px); }
  100% { transform: translate(0, 0) translateZ(12px); }
}

@keyframes box2 {
  0% { transform: rotateZ(90deg) translate(0, 0) translateZ(12px); }
  12.5% { transform: rotateZ(90deg) translate(0, 24px) translateZ(12px); }
  25% { transform: rotateZ(90deg) translate(24px, 24px) translateZ(12px); }
  37.5% { transform: rotateZ(90deg) translate(24px, 0) translateZ(12px); }
  50%, 100% { transform: rotateZ(90deg) translate(0, 0) translateZ(12px); }
}

@keyframes box3 {
  0%, 50% { transform: rotateZ(180deg) translate(0, 0) translateZ(12px); }
  62.5% { transform: rotateZ(180deg) translate(0, 24px) translateZ(12px); }
  75% { transform: rotateZ(180deg) translate(24px, 24px) translateZ(12px); }
  87.5% { transform: rotateZ(180deg) translate(24px, 0) translateZ(12px); }
  100% { transform: rotateZ(180deg) translate(0, 0) translateZ(12px); }
}

@keyframes box4 {
  0% { transform: rotateZ(270deg) translate(0, 0) translateZ(12px); }
  12.5% { transform: rotateZ(270deg) translate(0, 24px) translateZ(12px); }
  25% { transform: rotateZ(270deg) translate(24px, 24px) translateZ(12px); }
  37.5% { transform: rotateZ(270deg) translate(24px, 0) translateZ(12px); }
  50%, 100% { transform: rotateZ(270deg) translate(0, 0) translateZ(12px); }
}
</style>
