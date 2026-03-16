import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, Package, Heart } from 'lucide-react';

export const BoxPackingAnimation = () => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 1000), // Products drop
      setTimeout(() => setStage(2), 2500), // Flaps close one by one
      setTimeout(() => setStage(3), 4000), // Tape sealing
      setTimeout(() => setStage(4), 5000), // Box compress + move forward
      setTimeout(() => setStage(5), 6500), // Truck transition
      setTimeout(() => setStage(6), 8000), // Final success text
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 min-h-[350px] bg-white overflow-hidden relative">
      <style>{`
        .scene {
          perspective: 1000px;
          perspective-origin: 50% 50%;
          width: 240px;
          height: 240px;
          position: relative;
          transition: transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stage-4 .scene, .stage-5 .scene {
          transform: translateZ(-200px) translateY(50px) rotateX(10deg);
        }
        
        .stage-5 .scene {
          transform: translateZ(-400px) translateX(-500px) translateY(50px) rotateX(10deg);
        }

        .box {
          width: 160px;
          height: 160px;
          position: absolute;
          top: 30px;
          left: 40px;
          transform-style: preserve-3d;
          transform: rotateX(-20deg) rotateY(45deg);
          transition: transform 1s ease-in-out, scale 0.3s ease-in-out;
        }

        .stage-4 .box {
          animation: compress 0.5s ease-in-out forwards;
        }

        @keyframes compress {
          0% { transform: rotateX(-20deg) rotateY(45deg) scale(1); }
          50% { transform: rotateX(-20deg) rotateY(45deg) scale(0.95, 1.05); }
          100% { transform: rotateX(-20deg) rotateY(45deg) scale(1); }
        }

        .face {
          position: absolute;
          width: 160px;
          height: 160px;
          background: #d4a373; /* Realistic cardboard */
          border: 1px solid #bc8a5f;
          backface-visibility: visible;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 0 30px rgba(0,0,0,0.05);
        }

        .face::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url('https://www.transparenttextures.com/patterns/cardboard-flat.png');
          opacity: 0.2;
          pointer-events: none;
        }

        .front  { transform: rotateY(0deg) translateZ(80px); background: #e6b98e; }
        .back   { transform: rotateY(180deg) translateZ(80px); background: #c69465; }
        .right  { transform: rotateY(90deg) translateZ(80px); background: #dcae7f; }
        .left   { transform: rotateY(-90deg) translateZ(80px); background: #dcae7f; }
        .bottom { transform: rotateX(-90deg) translateZ(80px); background: #bc8a5f; box-shadow: 0 40px 80px rgba(0,0,0,0.1); }

        .logo-text {
          font-family: 'Outfit', 'Inter', sans-serif;
          font-weight: 900;
          color: rgba(60, 40, 30, 0.5);
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 2px;
          line-height: 1.1;
          text-align: center;
          border: 2px solid rgba(60, 40, 30, 0.1);
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
          width: 120px;
        }

        /* Flaps */
        .flap {
          position: absolute;
          width: 160px;
          height: 80px;
          background: #e6b98e;
          border: 1px solid #bc8a5f;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .flap-top    { bottom: 100%; left: 0; transform-origin: bottom; transform: rotateX(110deg); transition-delay: 0.1s; }
        .flap-bottom { top: 100%; left: 0; transform-origin: top; transform: rotateX(-110deg); transition-delay: 0.3s; }
        .flap-left   { width: 80px; height: 160px; right: 100%; top: 0; transform-origin: right; transform: rotateY(-105deg); transition-delay: 0.5s; }
        .flap-right  { width: 80px; height: 160px; left: 100%; top: 0; transform-origin: left; transform: rotateY(105deg); transition-delay: 0.7s; }

        .stage-2 .flap-left, .stage-3 .flap-left, .stage-4 .flap-left, .stage-5 .flap-left, .stage-6 .flap-left { transform: rotateY(0deg); }
        .stage-2 .flap-right, .stage-3 .flap-right, .stage-4 .flap-right, .stage-5 .flap-right, .stage-6 .flap-right { transform: rotateY(0deg); }
        .stage-2 .flap-top, .stage-3 .flap-top, .stage-4 .flap-top, .stage-5 .flap-top, .stage-6 .flap-top { transform: rotateX(0deg); z-index: 10; }
        .stage-2 .flap-bottom, .stage-3 .flap-bottom, .stage-4 .flap-bottom, .stage-5 .flap-bottom, .stage-6 .flap-bottom { transform: rotateX(0deg); z-index: 10; }

        /* Tape */
        .tape {
          position: absolute;
          width: 0;
          height: 25px;
          background: rgba(188, 138, 95, 0.6);
          backdrop-filter: blur(2px);
          top: 68px;
          left: 0;
          transform: translateZ(81px);
          transition: width 0.8s ease-in-out;
          border-top: 1px solid rgba(0,0,0,0.1);
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        .stage-3 .tape, .stage-4 .tape, .stage-5 .tape, .stage-6 .tape {
          width: 160px;
        }

        /* Products */
        .product {
          position: absolute;
          width: 45px;
          height: 45px;
          background: #f472b6;
          border-radius: 12px;
          top: -160px;
          left: 58px;
          opacity: 0;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .stage-1 .product-1 { transform: translateY(240px); opacity: 1; transition-delay: 0.1s; }
        .stage-1 .product-2 { transform: translateY(245px) translateX(25px) rotate(15deg); opacity: 1; transition-delay: 0.3s; }
        .stage-1 .product-3 { transform: translateY(235px) translateX(-25px) rotate(-15deg); opacity: 1; transition-delay: 0.5s; }

        /* Truck */
        .truck-scene {
          position: absolute;
          right: -400px;
          top: 50%;
          transform: translateY(-50%);
          transition: right 1s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
        }

        .stage-5 .truck-scene, .stage-6 .truck-scene {
          right: 50%;
          transform: translate(50%, -50%);
        }

        .truck-body {
          width: 150px;
          height: 100px;
          background: #1f2937;
          border-radius: 8px;
          position: relative;
        }

        .truck-cab {
          width: 60px;
          height: 60px;
          background: #111827;
          position: absolute;
          right: -55px;
          bottom: 0;
          border-radius: 0 12px 0 0;
        }

        /* Success Text */
        .success-text {
          position: absolute;
          bottom: 40px;
          left: 0;
          width: 100%;
          text-align: center;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s ease-out;
        }

        .stage-6 .success-text {
          opacity: 1;
          transform: translateY(0);
        }

        .glow-text {
          font-size: 24px;
          font-weight: 900;
          color: #db2777;
          text-shadow: 0 0 15px rgba(219, 39, 119, 0.3);
          background: linear-gradient(90deg, #db2777, #f472b6, #db2777);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-pulse 2s infinite;
        }

        @keyframes text-pulse {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(219, 39, 119, 0.5)); }
          50% { filter: drop-shadow(0 0 15px rgba(219, 39, 119, 0.8)); }
        }
      `}</style>

      <div className={`scene stage-${stage}`}>
        <div className="box">
          {/* Faces */}
          <div className="face front">
            <div className="logo-text">NHC<br />SERVICE</div>
          </div>
          <div className="face back"></div>
          <div className="face right"></div>
          <div className="face left"></div>
          <div className="face bottom"></div>

          {/* Products dropping in */}
          <div className="product product-1 flex items-center justify-center text-white"><Heart className="w-8 h-8 fill-current" /></div>
          <div className="product product-2 flex items-center justify-center text-white bg-purple-400"><Heart className="w-8 h-8 fill-current" /></div>
          <div className="product product-3 flex items-center justify-center text-white bg-pink-400"><Heart className="w-8 h-8 fill-current" /></div>

          {/* Flaps */}
          <div className="absolute top-0 left-0 w-full h-full transform-style-preserve-3d"
            style={{ transform: 'rotateX(90deg) translateZ(80px)' }}>
            <div className="flap flap-top"></div>
            <div className="flap flap-bottom"></div>
            <div className="flap flap-left"></div>
            <div className="flap flap-right"></div>
            <div className="tape"></div>
          </div>
        </div>
      </div>

      {/* Delivery Mode Transition */}
      <div className={`truck-scene stage-${stage}`}>
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="truck-body">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 font-black italic">EXPRESS</div>
            </div>
            <div className="truck-cab">
              <div className="w-8 h-6 bg-blue-400/30 rounded m-2" />
            </div>
            <div className="absolute -bottom-4 left-4 w-10 h-10 bg-gray-900 rounded-full border-4 border-gray-100" />
            <div className="absolute -bottom-4 left-24 w-10 h-10 bg-gray-900 rounded-full border-4 border-gray-100" />
          </div>
        </div>
      </div>

      {/* Success Success Message */}
      <div className="success-text">
        <div className="glow-text">Order Confirmed</div>
        <div className="text-gray-500 font-bold tracking-widest mt-1">PACKED & OUT FOR DELIVERY</div>
        <div className="flex items-center justify-center gap-2 mt-4 text-green-500 font-bold animate-pulse">
          <CheckCircle className="w-5 h-5" />
          <span>NHC Service Guarantee</span>
        </div>
      </div>

      {/* Progress Info (Debug/UX) */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center gap-2 px-10">
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${stage >= i ? 'bg-pink-500' : 'bg-gray-100'}`} />
        ))}
      </div>
    </div>
  );
};
