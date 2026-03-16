import { useState } from "react";
import { Search, Calendar, ChevronDown, ChevronRight, Send, Play, User, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

interface FutureRequestsProps {
    orders: any[];
    customers: any[];
    handleProcessRequest: (orderId: string, updates: any) => Promise<void>;
}



export function FutureRequests({ orders, customers, handleProcessRequest }: FutureRequestsProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
    const [processingOrder, setProcessingOrder] = useState<any>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [processForm, setProcessForm] = useState({
        paymentMethod: "Cash on Delivery",
        house: "",
        area: "",
        landmark: "",
        pincode: "",
        mapLink: ""
    });

    // Get all Not-Approved orders
    const futureOrders = orders.filter(o => o.orderStatus === 'Not Approved');

    // Group by customer name
    const grouped: Record<string, any[]> = {};
    futureOrders.forEach(order => {
        const key = `${order.fullName}|${order.phone}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(order);
    });

    // Filter by search, sort each customer's orders oldest-first
    const filteredGroups = Object.entries(grouped)
        .filter(([key]) => {
            if (!searchQuery) return true;
            const [name, phone] = key.split('|');
            return name.toLowerCase().includes(searchQuery.toLowerCase()) || phone.includes(searchQuery);
        })
        .map(([key, ords]) => ({
            key,
            name: key.split('|')[0],
            phone: key.split('|')[1],
            orders: [...ords].sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
        }));

    const openProcessDialog = (order: any) => {
        setProcessingOrder(order);
        setProcessForm({
            paymentMethod: order.paymentMethod && order.paymentMethod !== 'Pending' ? order.paymentMethod : "Cash on Delivery",
            house: order.address?.house || "",
            area: order.address?.area || "",
            landmark: order.address?.landmark || "",
            pincode: order.address?.pincode || "",
            mapLink: order.address?.mapLink || ""
        });
        setIsProcessDialogOpen(true);
    };

    const submitProcess = async () => {
        if (!processingOrder) return;
        await handleProcessRequest(processingOrder._id, {
            orderStatus: 'Requested',
            paymentMethod: processForm.paymentMethod,
            address: {
                house: processForm.house,
                area: processForm.area,
                landmark: processForm.landmark,
                pincode: processForm.pincode,
                mapLink: processForm.mapLink
            }
        });
        setIsProcessDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Header Search */}
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md flex justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search by customer name or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="ml-4 shrink-0">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-sm font-bold">
                        {futureOrders.length} Upcoming
                    </Badge>
                </div>
            </div>

            {/* Customer List */}
            {filteredGroups.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900">No future requests</p>
                    <p className="text-sm text-gray-500">Upcoming subscription cycles will appear here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredGroups.map(({ key, name, phone, orders: custOrders }) => {
                        const isOpen = selectedCustomer === key;
                        return (
                            <div key={key} className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
                                {/* Customer row / menu item */}
                                <button
                                    onClick={() => setSelectedCustomer(isOpen ? null : key)}
                                    className={`w-full flex items-center justify-between p-4 text-left transition-all duration-200 ${isOpen
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white hover:bg-blue-50 text-gray-800'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${isOpen ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 opacity-60" />
                                                <span className="font-bold text-base">{name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 opacity-70 text-sm">
                                                <Phone className="w-3 h-3" />
                                                <span>{phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={`font-bold text-xs ${isOpen ? 'bg-white/20 text-white border-none' : 'bg-blue-100 text-blue-700 border-none'}`}>
                                            {custOrders.length} order{custOrders.length > 1 ? 's' : ''}
                                        </Badge>
                                        {isOpen
                                            ? <ChevronDown className="w-5 h-5 opacity-80" />
                                            : <ChevronRight className="w-5 h-5 opacity-50" />
                                        }
                                    </div>
                                </button>

                                {/* Expanded order details */}
                                {isOpen && (
                                    <div className="divide-y divide-gray-100 bg-gray-50/50">
                                        {custOrders.map((order, idx) => (
                                            <div key={order._id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1">
                                                    {/* Step number */}
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0 text-sm mt-0.5">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-900">{order.phase}</span>
                                                            <span className="text-xs text-gray-400 font-mono">#{order.orderId?.replace('##', '#') || order._id.slice(-6).toUpperCase()}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                                            <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">{order.totalQuantity} laddus</span>
                                                            <span className="font-bold text-gray-800">₹{order.totalPrice}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-purple-700 text-xs font-bold mt-1">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            Scheduled: {formatDate(order.deliveryDate)}
                                                        </div>
                                                        {order.address?.house && (
                                                            <p className="text-xs text-gray-400">
                                                                📍 {order.address.house}, {order.address.area} - {order.address.pincode}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => openProcessDialog(order)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 shrink-0"
                                                    size="sm"
                                                >
                                                    <Play className="w-3.5 h-3.5 mr-2" />
                                                    Process Request
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Process Dialog */}
            <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Process Future Request</DialogTitle>
                        <DialogDescription>
                            {processingOrder && (
                                <span>
                                    Sending <strong>{processingOrder.fullName}</strong> — <strong>{processingOrder.phase}</strong> ({processingOrder.totalQuantity} laddus) scheduled for <strong>{formatDate(processingOrder.deliveryDate)}</strong>
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Payment Method</Label>
                            <Select value={processForm.paymentMethod} onValueChange={(v) => setProcessForm({ ...processForm, paymentMethod: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash on Delivery">Cash on Delivery</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Label className="text-blue-600 font-bold">Delivery Address</Label>
                        <div className="grid gap-2">
                            <Label>House/Flat No.</Label>
                            <Input value={processForm.house} onChange={e => setProcessForm({ ...processForm, house: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Area/Street</Label>
                            <Input value={processForm.area} onChange={e => setProcessForm({ ...processForm, area: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Pincode</Label>
                                <Input value={processForm.pincode} onChange={e => setProcessForm({ ...processForm, pincode: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Landmark</Label>
                                <Input value={processForm.landmark} onChange={e => setProcessForm({ ...processForm, landmark: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>Cancel</Button>
                        <Button onClick={submitProcess} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Send className="w-4 h-4 mr-2" />
                            Send Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
