import { Compass, Lock, Sparkles, ShieldCheck, Wallet, Leaf, Plus, Minus, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/hooks/useTranslation"

export default function FAQ() {
  const { t } = useTranslation()
    const faqs = [
      {
        question: t("faq_q1"),
        answer: t("faq_a1"),
      },
      {
        question: t("faq_q2"),
        answer: t("faq_a2"),
      },
      {
        question: t("faq_q3"),
        answer: t("faq_a3"),
      },
      {
        question: t("faq_q4"),
        answer: t("faq_a4"),
      },
      {
        question: t("faq_q5"),
        answer: t("faq_a5"),
      },
      {
        question: t("faq_q6"),
        answer: t("faq_a6"),
      },
    ]
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const toggleFAQ = (index: number) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };
    return (
        <section id="faq-section" className="relative z-10 py-24 px-6 bg-gradient-to-b from-white to-blue-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl bg-card border border-border p-12 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              {/* Left Column - Title and Description */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-balance text-foreground">
                  {t("faq_title")}
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed text-pretty">
                  {t("faq_description")}
                </p>
              </motion.div>

              {/* Right Column - FAQ Accordion */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <motion.button
                      whileHover={{ backgroundColor: "rgba(var(--primary), 0.05)" }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggleFAQ(index)}
                      className="w-full p-6 text-left flex items-center justify-between transition-colors"
                    >
                      <h3 className="text-lg font-semibold pr-4 text-foreground">{faq.question}</h3>
                      <motion.div
                        animate={{ rotate: openFaq === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {openFaq === index ? (
                          <Minus className="w-5 h-5 flex-shrink-0 text-primary" />
                        ) : (
                          <Plus className="w-5 h-5 flex-shrink-0 text-primary" />
                        )}
                      </motion.div>
                    </motion.button>
                    <AnimatePresence>
                      {openFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6">
                            <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    )
}
