import React from 'react';

export const DeliveryBox3D = () => {
    return (
        <div className="flex items-center justify-center py-10 perspective-1000">
            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotateX(-20deg) rotateY(45deg); }
          50% { transform: translateY(-20px) rotateX(-20deg) rotateY(45deg); }
        }
        @keyframes spin-box {
          from { transform: rotateX(-20deg) rotateY(0deg); }
          to { transform: rotateX(-20deg) rotateY(360deg); }
        }
        @keyframes open-lid-left {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(-110deg) translateY(-5px); }
        }
        @keyframes open-lid-right {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(110deg) translateY(-5px); }
        }

        .box-container {
          width: 120px;
          height: 120px;
          position: relative;
          transform-style: preserve-3d;
          animation: float 4s ease-in-out infinite;
        }

        .side {
          position: absolute;
          width: 120px;
          height: 120px;
          background: #d4a373; /* Cardboard brown */
          border: 1px solid #bc8a5f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #8b5e34;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          backface-visibility: visible;
        }

        .front  { transform: rotateY(0deg) translateZ(60px); background: #e6b98e; }
        .back   { transform: rotateY(180deg) translateZ(60px); background: #c69465; }
        .right  { transform: rotateY(90deg) translateZ(60px); background: #dcae7f; }
        .left   { transform: rotateY(-90deg) translateZ(60px); background: #dcae7f; }
        .bottom { transform: rotateX(-90deg) translateZ(60px); background: #bc8a5f; box-shadow: 0 0 50px rgba(0,0,0,0.2); }
        
        /* Two-part lid */
        .lid-left {
          position: absolute;
          width: 60px;
          height: 120px;
          background: #e6b98e;
          border: 1px solid #bc8a5f;
          top: 0;
          left: 0;
          transform-origin: left;
          transform: rotateX(90deg) translateZ(60px);
          animation: open-lid-left 1.5s ease-out 0.5s forwards;
        }
        .lid-right {
          position: absolute;
          width: 60px;
          height: 120px;
          background: #e6b98e;
          border: 1px solid #bc8a5f;
          top: 0;
          right: 0;
          transform-origin: right;
          transform: rotateX(90deg) translateZ(60px);
          animation: open-lid-right 1.5s ease-out 0.5s forwards;
        }

        .box-logo {
          transform: rotate(0deg);
          border: 1px solid rgba(139, 94, 52, 0.3);
          padding: 4px;
          border-radius: 4px;
        }
      `}</style>

            <div className="box-container">
                {/* Sides */}
                <div className="side front">
                    <div className="box-logo text-center">
                        Cycle<br />Harmony
                    </div>
                </div>
                <div className="side back"></div>
                <div className="side right"></div>
                <div className="side left"></div>
                <div className="side bottom"></div>

                {/* Lid segments */}
                <div className="lid-left"></div>
                <div className="lid-right"></div>

                {/* Content popping out (optional) */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translateZ(0px)' }}>
                    <span className="text-4xl animate-bounce" style={{ animationDelay: '1.2s' }}>🌸</span>
                </div>
            </div>
        </div>
    );
};
