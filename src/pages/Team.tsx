import { AppLayout } from "@/components/AppLayout";
import TeamManagement from "@/components/TeamManagement";

const Team = () => {
    return (
        <AppLayout
            title="Team"
            maxWidthClass="max-w-[1600px]"
            fullHeight
        >
            <TeamManagement />
        </AppLayout>
    );
};

export default Team;
