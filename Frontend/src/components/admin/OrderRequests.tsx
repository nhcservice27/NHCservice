import { useState } from "react";
import {
    MessageCircle, Search, Calendar, MapPin,
    User, Send, RefreshCw, Trash2, Clock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface OrderRequestsProps {
    orders: any[];
    customers: any[];
    handleWhatsAppSend: (order: any) => void;
    handleEmailNotify: (id: string) => void;
}

export function OrderRequests({ orders, customers, handleWhatsAppSend, handleEmailNotify }: OrderRequestsProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const requestedOrders = orders.filter(o =>
        o.orderStatus === 'Requested' &&
        (!searchQuery ||
            o.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.phone?.includes(searchQuery))
    );

    return (
        <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md flex justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search requests by name or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {requestedOrders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900">No pending requests</p>
                        <p className="text-sm text-gray-500">Initiate a request from the Orders tab</p>
                    </div>
                ) : (
                    requestedOrders.map((order) => (
                        <Card key={order._id} className="p-6 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-orange-50 text-orange-700 border-orange-100 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Awaiting Confirmation
                                        </Badge>
                                        <span className="text-xs text-gray-400 font-mono">#{order.orderId || order._id.slice(-6).toUpperCase()}</span>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{order.fullName}</h3>
                                        <p className="text-sm text-gray-500">{order.phone}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                            <span>{order.phase}</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                            <span>{order.totalQuantity} laddus</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-blue-700">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>Requested for: {formatDate(order.deliveryDate)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3 justify-between">
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-green-600">₹{order.totalPrice}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Sent {formatDate(order.createdAt)}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleWhatsAppSend(order)}
                                            className="text-green-600 border-green-100 hover:bg-green-50"
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            WhatsApp
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEmailNotify(order._id)}
                                            className="text-pink-500 border-pink-100 hover:bg-pink-50"
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            Email
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
