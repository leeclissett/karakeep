import { Alert, Platform, View } from "react-native";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useBookmarkListLayoutMenu } from "@/components/bookmarks/BookmarkListHeader";
import UpdatingBookmarkList from "@/components/bookmarks/UpdatingBookmarkList";
import QueryPageState from "@/components/QueryPageState";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { useToast } from "@/components/ui/Toast";
import { useArchiveFilter } from "@/lib/hooks";
import { useColorScheme } from "@/lib/useColorScheme";
import { useMenuIconColors } from "@/lib/useMenuIconColors";
import { MenuView } from "@react-native-menu/menu";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ellipsis } from "lucide-react-native";

import { useEditBookmarkList } from "@karakeep/shared-react/hooks/lists";
import { useTRPC } from "@karakeep/shared-react/trpc";
import { ZBookmarkList } from "@karakeep/shared/types/lists";

export default function ListView() {
  const { slug } = useLocalSearchParams();
  const api = useTRPC();
  if (typeof slug !== "string") {
    throw new Error("Unexpected param type");
  }
  const {
    data: list,
    error,
    refetch,
  } = useQuery(api.lists.get.queryOptions({ listId: slug }));
  const { archived, isLoading: isSettingsLoading } = useArchiveFilter();

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: list ? `${list.icon} ${list.name}` : "",
          headerBackTitle: "Back",
          headerRight: () => (
            <ListActionsMenu
              listId={slug}
              pinned={list?.pinned ?? false}
              role={list?.userRole ?? "viewer"}
            />
          ),
        }}
      />
      {!list ? (
        <QueryPageState error={error} onRetry={() => refetch()} />
      ) : !isSettingsLoading ? (
        <UpdatingBookmarkList
          query={{
            listId: list.id,
            archived,
          }}
        />
      ) : (
        <FullPageSpinner />
      )}
    </>
  );
}

function ListActionsMenu({
  listId,
  pinned,
  role,
}: {
  listId: string;
  pinned: boolean;
  role: ZBookmarkList["userRole"];
}) {
  const api = useTRPC();
  const { colors } = useColorScheme();
  const { menuIconColor, destructiveMenuIconColor } = useMenuIconColors();
  const { layoutActions, handleLayoutAction } = useBookmarkListLayoutMenu();
  const { toast } = useToast();
  const { mutate: editList, isPending: isPinning } = useEditBookmarkList({
    onError: () => {
      toast({ message: "Something went wrong", variant: "destructive" });
    },
  });
  const { mutate: deleteList } = useMutation(
    api.lists.delete.mutationOptions({
      onSuccess: () => {
        router.replace("/dashboard/lists");
      },
    }),
  );

  const { mutate: leaveList } = useMutation(
    api.lists.leaveList.mutationOptions({
      onSuccess: () => {
        router.replace("/dashboard/lists");
      },
    }),
  );

  const handleDelete = () => {
    Alert.alert("Delete List", "Are you sure you want to delete this list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => {
          deleteList({ listId });
        },
        style: "destructive",
      },
    ]);
  };

  const handleLeave = () => {
    Alert.alert("Leave List", "Are you sure you want to leave this list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        onPress: () => {
          leaveList({ listId });
        },
        style: "destructive",
      },
    ]);
  };

  const handleEdit = () => {
    router.push({
      pathname: "/dashboard/lists/[slug]/edit",
      params: { slug: listId },
    });
  };

  return (
    <MenuView
      actions={[
        ...layoutActions,
        {
          id: "toggle_pin",
          title: pinned ? "Unpin List" : "Pin List",
          attributes: {
            disabled: isPinning,
          },
          image: Platform.select({
            ios: pinned ? "pin.slash" : "pin",
          }),
          imageColor: Platform.select({
            ios: menuIconColor,
          }),
        },
        {
          id: "edit",
          title: "Edit List",
          attributes: {
            hidden: role !== "owner",
          },
          image: Platform.select({
            ios: "square.and.pencil",
          }),
          imageColor: Platform.select({
            ios: menuIconColor,
          }),
        },
        {
          id: "delete_list",
          title: "Delete List",
          attributes: {
            destructive: true,
            hidden: role !== "owner",
          },
          image: Platform.select({
            ios: "trash",
          }),
          imageColor: Platform.select({
            ios: destructiveMenuIconColor,
          }),
        },
        {
          id: "leave",
          title: "Leave List",
          attributes: {
            destructive: true,
            hidden: role === "owner",
          },
          image: Platform.select({
            ios: "arrowshape.turn.up.left",
          }),
          imageColor: Platform.select({
            ios: destructiveMenuIconColor,
          }),
        },
      ]}
      onPressAction={({ nativeEvent }) => {
        if (handleLayoutAction(nativeEvent.event)) {
          return;
        }

        if (nativeEvent.event === "toggle_pin") {
          editList({ listId, pinned: !pinned });
        } else if (nativeEvent.event === "delete_list") {
          handleDelete();
        } else if (nativeEvent.event === "leave") {
          handleLeave();
        } else if (nativeEvent.event === "edit") {
          handleEdit();
        }
      }}
      shouldOpenOnLongPress={false}
    >
      <View className="my-auto">
        <Ellipsis
          onPress={() => Haptics.selectionAsync()}
          color={colors.foreground}
        />
      </View>
    </MenuView>
  );
}
