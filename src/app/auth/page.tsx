// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'

// export default function AuthPage() {
//   const [password, setPassword] = useState('')
//   const [error, setError] = useState('')
//   const router = useRouter()

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
    
//     try {
//       const response = await fetch('/api/auth', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password }),
//       })

//       if (response.ok) {
//         router.push('/')
//         router.refresh()
//       } else {
//         setError('Invalid password')
//       }
//     } catch (err) {
//       setError('Something went wrong')
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-900">
//       <form onSubmit={handleSubmit} className="p-8 bg-gray-800 rounded-lg shadow-md w-full max-w-md">
//         <h1 className="text-2xl mb-4 text-white">Enter Password</h1>
//         <input
//           type="password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           className="border border-gray-600 bg-gray-700 text-white p-2 rounded mb-4 w-full"
//           placeholder="Enter password"
//         />
//         {error && <p className="text-red-400 mb-4">{error}</p>}
//         <button
//           type="submit"
//           className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
//         >
//           Submit
//         </button>
//       </form>
//     </div>
//   )
// } 