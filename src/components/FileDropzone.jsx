import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image, X } from 'lucide-react'
import clsx from 'clsx'

const FileDropzone = ({ uploadedImage, onFileUpload, onRemoveImage }) => {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith('image/')) {
      onFileUpload(file)
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false
  })

  return (
    <div className="mb-4">
      <AnimatePresence mode="wait">
        {!uploadedImage ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            {...getRootProps()}
            className={clsx(
              "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300",
              isDragActive 
                ? "border-purple-400 bg-purple-500/10 scale-105" 
                : "border-white/30 hover:border-white/50 hover:bg-white/5"
            )}
          >
            <input {...getInputProps()} />
            
            <motion.div
              animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className={clsx(
                "p-4 rounded-full transition-colors",
                isDragActive ? "bg-purple-500/20" : "bg-white/10"
              )}>
                <Upload className={clsx(
                  "w-8 h-8 transition-colors",
                  isDragActive ? "text-purple-400" : "text-white/70"
                )} />
              </div>
              
              <div>
                <p className={clsx(
                  "text-lg font-medium mb-1 transition-colors",
                  isDragActive ? "text-purple-300" : "text-white"
                )}>
                  {isDragActive ? "Drop your image here" : "Drag & drop an image"}
                </p>
                <p className="text-white/60 text-sm">
                  or click to browse • PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </motion.div>

            {isDragActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl"
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src={uploadedImage.preview} 
                  alt="Upload preview" 
                  className="w-20 h-20 object-cover rounded-xl shadow-lg"
                />
                <div className="absolute -top-2 -right-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRemoveImage}
                    className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </motion.button>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Image className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium truncate">
                    {uploadedImage.file.name}
                  </span>
                </div>
                <p className="text-white/60 text-sm">
                  {(uploadedImage.file.size / 1024 / 1024).toFixed(2)}MB • Ready to edit
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FileDropzone