"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

export const LoadingSpinner = memo(() => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className="flex items-center justify-center p-8 text-primary/60"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className="h-6 w-6" />
    </motion.div>
  </motion.div>
))
LoadingSpinner.displayName = 'LoadingSpinner'