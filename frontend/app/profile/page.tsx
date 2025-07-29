"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground py-12 px-4">
      <div className="bg-card rounded-2xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <Button variant="ghost" className="self-start mb-4 text-foreground hover:bg-muted" onClick={() => router.back()}>
          ← Back
        </Button>
        <Avatar className="h-20 w-20 mb-4 border-2 border-gray-200">
          <AvatarImage src="/placeholder-user.jpg" />
          <AvatarFallback className="bg-black text-white font-bold">JD</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold mb-2">John Doe</h2>
        <p className="text-gray-500 mb-6">john.doe@email.com</p>
        <Button className="w-full bg-black text-white hover:bg-gray-800 mb-2">Edit Profile</Button>
        <Button variant="outline" className="w-full">Change Password</Button>
      </div>
    </div>
  );
}
