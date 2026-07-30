import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeWeekStart, rankLeaderboard } from "@/lib/social/leaderboard";
import { computeQuestProgress } from "@/lib/social/quest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { FriendsSection } from "@/components/social/friends-section";
import { LeaderboardSection } from "@/components/social/leaderboard-section";
import { WorkbooksSection } from "@/components/social/workbooks-section";
import { QuestsSection } from "@/components/social/quests-section";

export const metadata: Metadata = { title: "Friends" };

export default async function SocialPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    redirect("/login");
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("display_name, leaderboard_opt_in, current_streak")
    .eq("id", userId)
    .maybeSingle();

  const { data: friendships } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  const otherUserIds = new Set<string>();
  for (const f of friendships ?? []) {
    otherUserIds.add(f.requester_id === userId ? f.addressee_id : f.requester_id);
  }

  const { data: otherProfiles } =
    otherUserIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, leaderboard_opt_in, current_streak")
          .in("id", [...otherUserIds])
      : { data: [] };

  const profileById = new Map((otherProfiles ?? []).map((p) => [p.id, p]));

  const incoming = (friendships ?? []).filter(
    (f) => f.addressee_id === userId && f.status === "pending",
  );
  const outgoing = (friendships ?? []).filter(
    (f) => f.requester_id === userId && f.status === "pending",
  );
  const accepted = (friendships ?? []).filter((f) => f.status === "accepted");

  // Leaderboard: me (if opted in) + accepted friends who are opted in.
  const weekStart = computeWeekStart(new Date().toISOString());
  const leaderboardUserIds = [
    ...(myProfile?.leaderboard_opt_in ? [userId] : []),
    ...accepted
      .map((f) => (f.requester_id === userId ? f.addressee_id : f.requester_id))
      .filter((id) => profileById.get(id)?.leaderboard_opt_in),
  ];

  const { data: weeklyXpEvents } =
    leaderboardUserIds.length > 0
      ? await supabase
          .from("xp_events")
          .select("user_id, amount")
          .in("user_id", leaderboardUserIds)
          .gte("created_at", weekStart)
      : { data: [] };

  const weeklyXpByUser = new Map<string, number>();
  for (const event of weeklyXpEvents ?? []) {
    weeklyXpByUser.set(event.user_id, (weeklyXpByUser.get(event.user_id) ?? 0) + event.amount);
  }

  const leaderboardEntries = rankLeaderboard(
    leaderboardUserIds.map((id) => {
      const isMe = id === userId;
      const profile = isMe ? myProfile : profileById.get(id);
      return {
        userId: id,
        displayName: isMe ? `${profile?.display_name ?? "You"} (you)` : profile?.display_name ?? "Friend",
        weeklyXp: weeklyXpByUser.get(id) ?? 0,
        currentStreak: profile?.current_streak ?? 0,
      };
    }),
  );

  // Workbooks: mine, and published ones from others to browse.
  const [{ data: myWorkbooks }, { data: browseWorkbooks }] = await Promise.all([
    supabase.from("workbooks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase
      .from("workbooks")
      .select("*")
      .eq("is_published", true)
      .neq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const [{ data: myTasks }, { data: myHabits }] = await Promise.all([
    supabase.from("tasks").select("id, title").order("created_at", { ascending: false }),
    supabase.from("habits").select("id, title").order("created_at", { ascending: false }),
  ]);

  // Co-op quests I'm a member of, with all members' contributions.
  const { data: myMemberships } = await supabase
    .from("co_op_quest_members")
    .select("quest_id")
    .eq("user_id", userId);
  const questIds = (myMemberships ?? []).map((m) => m.quest_id);

  const [{ data: quests }, { data: allMembers }, { data: allContributions }] =
    questIds.length > 0
      ? await Promise.all([
          supabase.from("co_op_quests").select("*").in("id", questIds),
          supabase.from("co_op_quest_members").select("quest_id, user_id").in("quest_id", questIds),
          supabase.from("co_op_quest_contributions").select("quest_id, user_id, amount").in("quest_id", questIds),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  const memberIds = new Set<string>();
  for (const m of allMembers ?? []) memberIds.add(m.user_id);
  const { data: memberProfiles } =
    memberIds.size > 0
      ? await supabase.from("profiles").select("id, display_name").in("id", [...memberIds])
      : { data: [] };
  const memberNameById = new Map((memberProfiles ?? []).map((p) => [p.id, p.display_name ?? "Friend"]));

  const questItems = (quests ?? []).map((quest) => {
    const contributions = (allContributions ?? []).filter((c) => c.quest_id === quest.id);
    const progress = computeQuestProgress(
      contributions.map((c) => c.amount),
      quest.target_count,
    );
    const members = (allMembers ?? [])
      .filter((m) => m.quest_id === quest.id)
      .map((m) => memberNameById.get(m.user_id) ?? "Friend");
    return { ...quest, progress, members };
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Friends</h1>
          <p className="text-sm text-muted-foreground">
            Add friends, compete on the weekly leaderboard, and share routines.
          </p>
        </div>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Back to dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle render={<h2 />}>Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <FriendsSection
            incoming={incoming.map((f) => ({
              friendshipId: f.id,
              displayName: profileById.get(f.requester_id)?.display_name ?? "Someone",
            }))}
            outgoing={outgoing.map((f) => ({
              friendshipId: f.id,
              displayName: profileById.get(f.addressee_id)?.display_name ?? "Someone",
            }))}
            accepted={accepted.map((f) => {
              const otherId = f.requester_id === userId ? f.addressee_id : f.requester_id;
              return {
                friendshipId: f.id,
                displayName: profileById.get(otherId)?.display_name ?? "Friend",
              };
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle render={<h2 />}>Weekly leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaderboardSection
            entries={leaderboardEntries}
            optedIn={myProfile?.leaderboard_opt_in ?? false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle render={<h2 />}>Workbooks</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkbooksSection
            myWorkbooks={myWorkbooks ?? []}
            browseWorkbooks={browseWorkbooks ?? []}
            tasks={myTasks ?? []}
            habits={myHabits ?? []}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle render={<h2 />}>Co-op quests</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestsSection
            quests={questItems.map((q) => ({
              id: q.id,
              title: q.title,
              progress: q.progress,
              members: q.members,
            }))}
            friends={accepted.map((f) => {
              const otherId = f.requester_id === userId ? f.addressee_id : f.requester_id;
              return { id: otherId, displayName: profileById.get(otherId)?.display_name ?? "Friend" };
            })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
