import { Home, Bell, Plus, Sofa, Bed, CookingPot, Trash2, Box, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useRoomStore } from '@/store/useRoomStore';
import { useAlertStore } from '@/store/useAlertStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AddRoomModal } from '@/components/rooms/AddRoomModal';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sofa, Bed, CookingPot, Box,
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const rooms = useRoomStore((s) => s.rooms);
  const removeRoom = useRoomStore((s) => s.removeRoom);
  const alerts = useAlertStore((s) => s.alerts);
  const unreadCount = alerts.filter((a) => !a.read).length;
  const [showAddRoom, setShowAddRoom] = useState(false);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/" end activeClassName="bg-accent text-accent-foreground font-medium">
                      <Home className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Dashboard</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/alerts" end activeClassName="bg-accent text-accent-foreground font-medium">
                      <Bell className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <span className="flex items-center gap-2">
                          Alerts
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 min-w-4 justify-center">
                              {unreadCount}
                            </Badge>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/settings" end activeClassName="bg-accent text-accent-foreground font-medium">
                      <Settings className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Settings</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>
              <span className="flex items-center justify-between w-full">
                Rooms
                {!collapsed && (
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowAddRoom(true)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {rooms.map((room) => {
                  const Icon = iconMap[room.icon] || Box;
                  return (
                    <SidebarMenuItem key={room.id}>
                      <SidebarMenuButton asChild>
                        <NavLink to={`/room/${room.id}`} activeClassName="bg-accent text-accent-foreground font-medium">
                          <Icon className="mr-2 h-4 w-4" />
                          {!collapsed && (
                            <span className="flex items-center justify-between w-full">
                              {room.name}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeRoom(room.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="p-2 text-[10px] text-muted-foreground text-center">
            XIOT v1.0
          </div>
        </SidebarFooter>
      </Sidebar>

      <AddRoomModal open={showAddRoom} onOpenChange={setShowAddRoom} />
    </>
  );
}
