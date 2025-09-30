import { GraduationCap } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // versão shadcn/ui

export function Header() {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">EduProvas IA</span>
        </div>

        {/* Perfil + nome */}
        <div className="flex items-center  gap-2">
          <a
            href="http://www.linkedin.com/in/jonnatan-farias"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src="https://media.licdn.com/dms/image/v2/D4D03AQGL_f3fXa4dpg/profile-displayphoto-crop_800_800/B4DZmGOM5qH0AI-/0/1758893494903?e=1761782400&v=beta&t=gca3wmChoDTSoPdk-Uz6nqZ1raoXSK1gDoCWBNT_tZg" />
              <AvatarFallback>JF</AvatarFallback>
            </Avatar>
                <div className="flex flex-col">
                    <small className="hidden sm:inline font-medium">Dev. Jonnatan Farias</small>
                    <small className="hidden sm:inline font-semibold text-[9px] text-red-500 ">( Versão: 25.09.1.1 )</small>
                </div>
          </a>
        </div>
      </div>
    </header>
  )
}
