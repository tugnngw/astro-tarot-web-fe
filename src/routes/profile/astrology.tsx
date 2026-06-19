// src/routes/profile/astrology.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { StarField } from "@/components/StarField";
import { useAuth } from "@/lib/auth-context";
import { getAstrologyProfiles, deleteAstrologyProfile } from "@/api/astrology";
import type { AstrologyProfile } from "@/api/astrology";
import { toast } from "sonner";

export const Route = createFileRoute("/profile/astrology")({
    component: AstrologyProfilesPage,
});

function AstrologyProfilesPage() {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<AstrologyProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadProfiles();
        }
    }, [user]);

    const loadProfiles = async () => {
        setLoading(true);
        try {
            const data = await getAstrologyProfiles();
            setProfiles(data);
        } catch (error) {
            toast.error("Không thể tải danh sách profile");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa profile này?")) return;
        try {
            await deleteAstrologyProfile(id);
            setProfiles(profiles.filter(p => p.id !== id));
            toast.success("Đã xóa profile");
        } catch (error) {
            toast.error("Không thể xóa profile");
        }
    };

    if (!user) {
        return (
            <div className="relative min-h-screen">
                <Header />
                <StarField count={30} />
                <div className="mx-auto max-w-4xl px-6 py-20 text-center">
                    <h1 className="font-display text-3xl text-gradient-gold">Vui lòng đăng nhập</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen">
            <Header />
            <StarField count={30} />
            <div className="mx-auto max-w-4xl px-6 py-10">
                <h1 className="font-display text-3xl text-gradient-gold">Thông tin chiêm tinh</h1>
                <p className="mt-1 text-sm text-muted-foreground">Quản lý hồ sơ chiêm tinh của bạn</p>

                {loading ? (
                    <div className="mt-8 text-center text-muted-foreground">Đang tải...</div>
                ) : profiles.length === 0 ? (
                    <div className="mt-8 glass rounded-2xl p-8 text-center">
                        <p className="text-muted-foreground">Chưa có thông tin chiêm tinh</p>
                        <p className="text-sm text-muted-foreground/60">Hãy rút bài Tarot để tạo hồ sơ</p>
                    </div>
                ) : (
                    <div className="mt-6 space-y-4">
                        {profiles.map((profile) => (
                            <div key={profile.id} className="glass rounded-2xl p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-display text-xl text-gold-soft">
                                            {profile.title}
                                            {profile.isPrimary && (
                                                <span className="ml-2 text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                          Chính
                        </span>
                                            )}
                                        </h3>
                                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                            <p><span className="text-foreground">Tên:</span> {profile.targetName || "N/A"}</p>
                                            <p><span className="text-foreground">Ngày sinh:</span> {profile.birthDate}</p>
                                            <p><span className="text-foreground">Giờ sinh:</span> {profile.birthTime || "N/A"}</p>
                                            <p><span className="text-foreground">Nơi sinh:</span> {profile.birthPlace}</p>
                                            <p><span className="text-foreground">Loại:</span> {profile.profileType}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(profile.id)}
                                        className="text-destructive hover:text-destructive/80 text-sm"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}