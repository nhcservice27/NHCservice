import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, Phone, MapPin, Building, Send, CheckCircle, MessageSquare, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const ContactUs = () => {
  useEffect(() => {
    document.title = "Connect | Cycle Harmony";
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      toast.error("Please complete all sections of your request.");
      setIsSubmitting(false);
      return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

    try {
      const res = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          message: formData.message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to send');

      toast.success("Message received.", { description: "We will synchronize with you shortly." });
      setIsSubmitted(true);
      setFormData({ name: "", phone: "", message: "" });
    } catch (error) {
      toast.error("Transmission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-wellness-cream/30">
      <Navbar />

      <div className="container mx-auto px-6 py-40 max-w-6xl space-y-24">
        {/* Header Ritual */}
        <div className="text-center space-y-6">
          <span className="text-foreground/40 font-bold tracking-[0.4em] uppercase text-[10px] block">Get in Touch</span>
          <h1 className="font-heading text-6xl md:text-8xl font-bold text-foreground leading-tight tracking-tight">
            Let's <span className="italic text-wellness-green">Synchronize</span>.
          </h1>
          <p className="text-xl text-foreground/50 max-w-2xl mx-auto font-body">
            Have questions about your wellness journey? Our experts are here to guide you through nature's wisdom.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Ritual Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-12 border border-foreground/5 shadow-premium space-y-12">
              <h2 className="font-heading text-3xl font-bold text-foreground">Channels</h2>
              
              <div className="space-y-10">
                <div className="group flex items-center gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/40 group-hover:bg-foreground group-hover:text-background transition-all">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30 mb-1">Email Ritual</p>
                        <a href="mailto:nhccycleharmony@gmail.com" className="text-lg font-bold text-foreground hover:text-wellness-green transition-colors">nhccycleharmony@gmail.com</a>
                    </div>
                </div>

                <div className="group flex items-center gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/40 group-hover:bg-[#25D366] group-hover:text-white transition-all">
                        <Phone className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30 mb-1">WhatsApp Support</p>
                        <p className="text-lg font-bold text-foreground">+91 93471 22416</p>
                    </div>
                </div>

                <div className="group flex items-center gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/40 group-hover:bg-wellness-sage group-hover:text-foreground transition-all">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30 mb-1">Logistics Locale</p>
                        <p className="text-lg font-bold text-foreground">Hyderabad, India</p>
                    </div>
                </div>
              </div>

              <div className="pt-8 border-t border-foreground/5">
                 <p className="text-xs text-foreground/40 leading-relaxed">
                    <strong>Response Protocol:</strong> We typically synchronize within 24-48 solar hours. Monday - Sunday, 9:00 AM - 6:00 PM IST.
                 </p>
              </div>
            </div>
          </div>

          {/* Contact Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[2.5rem] p-12 border border-foreground/5 shadow-premium">
              {isSubmitted ? (
                <div className="text-center py-20 space-y-8">
                  <div className="w-24 h-24 bg-wellness-green text-white rounded-full flex items-center justify-center mx-auto shadow-premium-lg">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-4xl font-heading font-bold text-foreground">Inquiry Sent.</h3>
                    <p className="text-foreground/50 font-body">Thank you for reaching out to Cycle Harmony.</p>
                  </div>
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                    className="h-14 px-10 rounded-full border-foreground/10 hover:border-foreground"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-10">
                  <h2 className="font-heading text-3xl font-bold text-foreground">Secure Message</h2>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30 px-2">Your Name</Label>
                        <div className="relative">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/20" />
                            <Input
                                name="name"
                                placeholder="Sophisticated Name"
                                value={formData.name}
                                onChange={handleChange}
                                className="h-16 pl-14 pr-8 rounded-2xl border-foreground/5 bg-foreground/5 focus:bg-white transition-all text-sm font-medium"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30 px-2">Phone Signature</Label>
                        <div className="relative">
                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/20" />
                            <Input
                                name="phone"
                                placeholder="+91 00000 00000"
                                value={formData.phone}
                                onChange={handleChange}
                                className="h-16 pl-14 pr-8 rounded-2xl border-foreground/5 bg-foreground/5 focus:bg-white transition-all text-sm font-medium"
                                required
                            />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30 px-2">Your Message</Label>
                    <Textarea
                      name="message"
                      placeholder="How can nature assist you today?"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="p-8 rounded-[2rem] border-foreground/5 bg-foreground/5 focus:bg-white transition-all resize-none text-sm font-medium min-h-[200px]"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="hero"
                    className="w-full h-18 rounded-full shadow-premium-lg group overflow-hidden"
                  >
                    {isSubmitting ? (
                        <div className="flex items-center gap-3">
                            <span className="animate-spin text-xl">⏳</span>
                            Synchronizing...
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-3">
                            Transmit Message <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
                        </div>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactUs;

