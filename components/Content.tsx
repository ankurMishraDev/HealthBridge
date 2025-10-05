import { Brain, ShieldCheck, MessageCircle, TrendingUp, Heart, Users } from "lucide-react"
import { motion } from "framer-motion"
import { useTranslation } from "@/hooks/useTranslation"

export default function Content() {
  const { t } = useTranslation()
    return(
        <div>
        {/* Features Section */}
      <section id="why-choose-anamai" className="relative z-10 bg-gradient-to-b from-white to-blue-50/50 py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{t("content_whyChoose")}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("content_experience")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* AI-Powered Insights */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="rounded-2xl bg-card border border-border p-8 text-center hover:shadow-2xl hover:border-primary/20 transition-all duration-500 ease-out cursor-pointer group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-6 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                <Brain className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t("content_aiInsights")}</h3>
              <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">{t("content_aiInsightsDesc")}</p>
            </motion.div>

            {/* 24/7 Support */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="rounded-2xl bg-card border border-border p-8 text-center hover:shadow-2xl hover:border-primary/20 transition-all duration-500 ease-out cursor-pointer group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-6 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                <MessageCircle className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t("content_247Support")}</h3>
              <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">{t("content_247SupportDesc")}</p>
            </motion.div>

            {/* Privacy & Security */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="rounded-2xl bg-card border border-border p-8 text-center hover:shadow-2xl hover:border-primary/20 transition-all duration-500 ease-out cursor-pointer group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-6 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                <ShieldCheck className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t("content_privacy")}</h3>
              <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">{t("content_privacyDesc")}</p>
            </motion.div>

            {/* Mood Tracking */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="rounded-2xl bg-card border border-border p-8 text-center hover:shadow-2xl hover:border-primary/20 transition-all duration-500 ease-out cursor-pointer group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-6 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                <TrendingUp className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t("content_healthTracking")}</h3>
              <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">{t("content_healthTrackingDesc")}</p>
            </motion.div>

            {/* Personalized Care */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="rounded-2xl bg-card border border-border p-8 text-center hover:shadow-2xl hover:border-primary/20 transition-all duration-500 ease-out cursor-pointer group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-6 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                <Heart className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t("content_personalizedCare")}</h3>
              <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">{t("content_personalizedCareDesc")}</p>
            </motion.div>

            {/* Community Support */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="rounded-2xl bg-card border border-border p-8 text-center hover:shadow-2xl hover:border-primary/20 transition-all duration-500 ease-out cursor-pointer group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-6 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                <Users className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t("content_doctorSupport")}</h3>
              <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">{t("content_doctorSupportDesc")}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section id="wellness-journey" className="relative z-10 bg-gradient-to-b from-blue-50/50 to-white py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-card border border-border p-8 shadow-lg sm:p-12">
            {/* Section Header */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">{t("content_wellnessJourney")}</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
                {t("content_wellnessJourneyDesc")}
              </p>
            </motion.div>

            {/* Journey Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Phase 1: Assessment */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.03,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                className="rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 p-8 h-80 flex flex-col hover:shadow-2xl hover:border-primary/30 hover:from-primary/10 hover:to-secondary/10 transition-all duration-500 ease-out cursor-pointer group"
              >
                <div className="flex-1">
                  <div className="text-3xl font-bold text-primary mb-4 group-hover:scale-110 group-hover:text-primary/90 transition-all duration-300">01.</div>
                  <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t("content_initialAssessment")}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm group-hover:text-foreground transition-colors duration-300">
                    {t("content_initialAssessmentDesc")}
                  </p>
                </div>
              </motion.div>

              {/* Phase 2: Personalized Plan */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.03,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                className="rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 p-8 h-80 flex flex-col hover:shadow-2xl hover:border-primary/30 hover:from-primary/10 hover:to-secondary/10 transition-all duration-500 ease-out cursor-pointer group"
              >
                <div className="flex-1">
                  <div className="text-3xl font-bold text-primary mb-4 group-hover:scale-110 group-hover:text-primary/90 transition-all duration-300">02.</div>
                  <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t("content_personalizedPlan")}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm group-hover:text-foreground transition-colors duration-300">
                    {t("content_personalizedPlanDesc")}
                  </p>
                </div>
              </motion.div>

              {/* Phase 3: Daily Support */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.03,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                className="rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 p-8 h-80 flex flex-col hover:shadow-2xl hover:border-primary/30 hover:from-primary/10 hover:to-secondary/10 transition-all duration-500 ease-out cursor-pointer group"
              >
                <div className="flex-1">
                  <div className="text-3xl font-bold text-primary mb-4 group-hover:scale-110 group-hover:text-primary/90 transition-all duration-300">03.</div>
                  <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t("content_dailySupport")}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm group-hover:text-foreground transition-colors duration-300">
                    {t("content_dailySupportDesc")}
                  </p>
                </div>
              </motion.div>

              {/* Phase 4: Growth & Community */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.03,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                className="rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 p-8 h-80 flex flex-col hover:shadow-2xl hover:border-primary/30 hover:from-primary/10 hover:to-secondary/10 transition-all duration-500 ease-out cursor-pointer group"
              >
                <div className="flex-1">
                  <div className="text-3xl font-bold text-primary mb-4 group-hover:scale-110 group-hover:text-primary/90 transition-all duration-300">04.</div>
                  <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t("content_growthCommunity")}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm group-hover:text-foreground transition-colors duration-300">
                    {t("content_growthCommunityDesc")}
                  </p>
                </div>
              </motion.div>
            </div>

            
          </div>
        </div>
      </section>
      </div>
    )
}
