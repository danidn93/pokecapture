import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Pokeball from '@/components/Pokeball';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User as UserIcon, Mail, Lock } from 'lucide-react';
import { z } from 'zod';
import AvatarPicker from '@/components/AvatarPicker';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');
const usernameSchema = z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(20, 'Máximo 20 caracteres');

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (isSignUp) usernameSchema.parse(username);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    if (isSignUp && !avatar) {
      toast.error("Debes elegir un avatar antes de continuar");
      return;
    }

    setIsLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, username, avatar!);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este email ya está registrado');
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }

      toast.success(`¡Cuenta creada! Bienvenido, ${username}`);
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login')) {
          toast.error('Email o contraseña incorrectos');
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }

      toast.success('¡Bienvenido de nuevo!');
    }

    setIsLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Pokeball size={100} />
          </motion.div>

          <h1 className="mt-6 text-2xl sm:text-3xl font-display text-pokemon-yellow text-center leading-relaxed">
            PokeCapture
          </h1>
          <p className="text-muted-foreground font-body mt-2">
            ¡Atrapa a todos!
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card/50 backdrop-blur-lg rounded-2xl p-6 border border-border"
        >
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre de Entrenador */}
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm font-body text-muted-foreground">
                  Nombre de entrenador
                </label>

                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Tu nombre único"
                    className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground font-body"
                    maxLength={20}
                  />
                </div>
              </div>
            )}

            {/* Avatar Picker */}
            {isSignUp && (
              <div>
                <label className="text-sm font-body text-muted-foreground">
                  Elige tu avatar
                </label>
                <AvatarPicker selected={avatar} onSelect={setAvatar} />
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-body text-muted-foreground">Email</label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground font-body"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <label className="text-sm font-body text-muted-foreground">Contraseña</label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground font-body"
                />
              </div>
            </div>

            {/* Botón */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-pokeball-gradient hover:opacity-90 text-primary-foreground font-display text-sm py-6"
            >
              {isLoading ? 'CARGANDO...' : isSignUp ? '¡CREAR CUENTA!' : '¡INICIAR SESIÓN!'}
            </Button>
          </form>

          {/* Cambiar entre Login / Registro */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </motion.div>

        {/* PWA hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          Instala la app desde tu navegador para la mejor experiencia
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;
