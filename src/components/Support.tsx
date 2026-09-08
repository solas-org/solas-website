import React, { useState, memo } from 'react';
import { motion } from 'motion/react';
import { Heart, Send, QrCode } from 'lucide-react';
import GameButton from './GameButton';

function SupportComponent() {
  const [, setQrError] = useState(false);
  const [tgError, setTgError] = useState(false);

  return (
    <section className="py-20 relative bg-transparent" id="project-support-section">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute bottom-[-10%] right-[20%] w-[450px] h-[450px] rounded-full pointer-events-none" 
          style={{
            background: 'radial-gradient(circle, rgba(208, 188, 255, 0.12) 0%, rgba(208, 188, 255, 0.03) 45%, transparent 70%)',
          }}
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          className="absolute top-[-10%] left-[20%] w-[400px] h-[350px] rounded-full pointer-events-none" 
          style={{
            background: 'radial-gradient(circle, rgba(239, 184, 200, 0.10) 0%, rgba(239, 184, 200, 0.02) 45%, transparent 70%)',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        
        {/* Module Header */}
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-2xl md:text-4xl text-white mt-4 tracking-tight">
            Поддержка
          </h2>
          <p className="mt-3 text-m text-[#cac4d0] max-w-lg mx-auto">
            Solas создаётся независимыми инди-разработчиками. Вы можете помочь нам донатом за символическую сумму.
          </p>
        </div>

        {/* Support Grid: QR Left, Text Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center max-w-4xl mx-auto mb-16">
          
          {/* LEFT COLUMN: Stylized Glass QR Code - col-span-5 */}
          <div className="md:col-span-5 flex justify-center">
            <motion.div 
              whileHover={{ scale: 1.02, rotate: 1 }}
              className="p-6 rounded-2xl m3-glass border border-white/10 flex flex-col items-center justify-center text-center relative shadow-2xl w-full max-w-[280px]"
            >
              {/* Scan target lines matching panel corners */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-m3-primary rounded-tl-md" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-m3-primary rounded-tr-md" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-m3-primary rounded-bl-md" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-m3-primary rounded-br-md" />

              {/* Polished custom geometric SVG QR mockup or Real Image */}
              <div className="bg-white p-4 rounded-2xl shadow-inner mb-4 w-44 h-44 flex items-center justify-center relative overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}qr.png`} 
                  alt="Донат QR" 
                  onError={() => setQrError(true)} 
                  className="w-full h-full object-contain select-none" 
                  referrerPolicy="no-referrer"
                />

                {/* Scan Overlay Effect */}
                <div className="absolute inset-x-0 h-0.5 bg-m3-primary shadow-[0_0_8px_#D0BCFF] animate-[bounce_3s_ease-in-out_infinite]" />
              </div>

              <span className="text-[10px] font-mono tracking-widest text-m3-primary uppercase flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-m3-primary" />
                Сканируйте для доната
              </span>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Supporting Appeal - col-span-7 */}
          <div className="md:col-span-7 space-y-5 text-center md:text-left">
            <h3 className="font-display font-bold text-lg md:text-xl text-white flex items-center justify-center md:justify-start gap-2.5">
              Помогите создать движок мечты
            </h3>
            
            <p className="text-[#cac4d0] text-m leading-relaxed max-w-xl">
              Разработка <span className="font-semibold text-white">Solas</span> : независимый шаг к созданию совершенных условий для геймдева. Мы пишем высокопроизводительный, полностью бесплатный движок на .NET 10.
            </p>
            <p className="text-[#cac4d0] text-m leading-relaxed max-w-xl">
              Ваши пожертвования мотивируют нас и помогают быстрее выпускать обновления и писать документацию, внесите свой вклад в open-source и станьте частью комьюнити.
            </p>
            
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <GameButton
                id="donation-wallet-btn"
                onClick={() => window.open('https://pay.cloudtips.ru/p/65fe2c6c', '_blank')}
                variant="primary"
                className="px-6 py-3.5"
              >
                <Heart className="w-5 h-5 animate-pulse" />
                СДЕЛАТЬ ДОНАТ
              </GameButton>
              
              <span className="text-[12px] font-mono text-[#cac4d0]/60 max-w-[200px] text-center sm:text-left">
                Cloud Tips
              </span>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: Social Network Blob Card */}
        <div className="max-w-4xl mx-auto text-center" id="social-networks-container">
          
          {/* Big Expressive Blob like the main demo stand */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ 
              scale: 1.015,
              y: -3,
              borderColor: 'rgba(208, 188, 255, 0.35)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.45), 0 0 40px rgba(208, 188, 255, 0.08)'
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="p-8 md:p-12 rounded-2xl m3-glass border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 transition-[border-color,box-shadow] duration-300 shadow-2xl"
          >
            {/* Background glowing shape matching "Демо-стенд" style */}
            <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-m3-primaryContainer/20 to-transparent pointer-events-none z-0" />
            
            {/* Decorative ambient glow behind the text */}
            <div 
              className="absolute left-[-5%] top-[-20%] w-56 h-56 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(208, 188, 255, 0.16) 0%, rgba(208, 188, 255, 0.04) 40%, transparent 70%)',
              }}
            />

            <div className="text-left relative z-10 max-w-lg">
              <span className="text-[10px] font-mono text-m3-primary font-bold uppercase tracking-widest block mb-2">
                СВЯЗЬ И ОБЩЕНИЕ
              </span>
              <h3 className="font-display font-semibold text-2xl md:text-3xl text-white mb-2">
                Соцсети проекта
              </h3>
              <p className="text-sm text-[#cac4d0] leading-relaxed">
                Присоединяйтесь к нашему растущему телеграмм каналу! Следите за новостями и релизами, обсуждайте архитектуру, делитесь бенчмарками и узнавайте инсайды разработки.
              </p>
            </div>

            {/* Telegram Icon Button */}
            <motion.a
              href="https://t.me/SolasEngine"
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 flex items-center justify-center relative cursor-pointer z-10 group outline-none"
              title="Открыть Telegram канал"
              id="telegram-channel-button"
            >
              {/* Outer Orbit Ring (spinning and expanding on group hover) */}
              <div className="absolute -inset-2.5 border border-dashed border-sky-400/30 rounded-full group-hover:animate-[spin_8s_linear_infinite] group-hover:scale-110 transition-all duration-300 pointer-events-none" />
              
              {/* Actual Background Circle (handles styling, scales up on hover) */}
              <div className="absolute inset-0 bg-[#229ED9] rounded-full shadow-[0_8px_32px_rgba(34,158,217,0.35)] group-hover:scale-105 group-hover:shadow-[0_12px_40px_rgba(34,158,217,0.5)] transition-all duration-300 border border-white/10" />

              {/* Icon Content (rotates and scales slightly) */}
              <div className="relative z-10 text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                {!tgError ? (
                  <img 
                    src={`${import.meta.env.BASE_URL}telegram.png`} 
                    alt="Telegram" 
                    onError={() => setTgError(true)} 
                    className="w-8 h-8 object-contain select-none" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Send className="w-7 h-7 rotate-[15deg] translate-x-[-1px] translate-y-[1px] fill-white text-white" />
                )}
              </div>
            </motion.a>

          </motion.div>
          
        </div>

      </div>
    </section>
  );
}

export default memo(SupportComponent);
